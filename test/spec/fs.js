/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true,
undef:true, unused:true, curly:true, devel:true, indent:2, maxerr:50, newcap:true, browser:true, jquery:true */
/*global whim, describe, it, runs, waitsFor, expect, jasmine*/
(function(){
  "use strict";
  describe("whim.fs", function(){
    var done, result;
    var testfolder = "[code]/test" + Math.random();
    
    it("can list root", function(){
      runs(function(){
        done = false;
        whim.fs.read("/", ["name"], function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
        // testfolder = "/"+result.entries[0].name+"/test"+Math.random();
      });
    });
    it("cannot write to root", function(){
      runs(function(){
        done = false;
        whim.fs.write("/", null, null, function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(false);
      });
    });
    
    it("can create a folder", function(){
      runs(function(){
        done = false;
        whim.fs.write(testfolder, null, null, function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
      });
    });
    it("can delete a folder", function(){
      runs(function(){
        done = false;
        whim.fs.delete(testfolder, function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
        expect(result.status).toBe("directory deleted");
      });
    });
    it("can create folders recursively", function(){
      runs(function(){
        done = false;
        whim.fs.write(testfolder+"/this/is/a/very/long/path", null, null, function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
      });
    });
    
    it("can write to a file", function(){
      runs(function(){
        done = false;
        whim.fs.write(testfolder+"/test.txt", "Små søde jordbær", "utf8", function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
      });
    });
    it("can read from a file", function(){
      runs(function(){
        done = false;
        whim.fs.read(testfolder+"/test.txt", "utf8", function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
        expect(result.data).toBe("Små søde jordbær");
      });
    });
    it("can get properties from a file", function(){
      runs(function(){
        done = false;
        whim.fs.probe(testfolder+"/test.txt", function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
        expect(result.properties.name).toBe("test.txt");
        expect(result.properties.isFile).toBe(true);
        expect(result.properties.isDir).toBe(false);
        expect(result.properties.isLink).toBe(false);
        expect(result.properties.size).toEqual(jasmine.any(Number));
        expect(result.properties.atime).toEqual(jasmine.any(Date));
        expect(result.properties.ctime).toEqual(jasmine.any(Date));
        expect(result.properties.mtime).toEqual(jasmine.any(Date));
      });
    });
    
    it("can list entries from a folder in specified order", function(){
      var setup = 6;
      runs(function(){
        whim.fs.write(testfolder+"/carol", null, null, function(){ setup--; });
        whim.fs.write(testfolder+"/bob", null, null, function(){ setup--; });
        whim.fs.write(testfolder+"/bob.txt",   "the builder..", "utf8", function(){ setup--; });
        whim.fs.write(testfolder+"/alice.txt", "in wonderland!", "utf8", function(){ setup--; });
        whim.fs.write(testfolder+"/alice", null, null, function(){ setup--; });
        whim.fs.write(testfolder+"/carol.txt", "I am but a fool...", "utf8", function(){ setup--; });
      });
      
      waitsFor(function(){
        return setup === 0;
      });
      
      runs(function(){
        done = false;
        whim.fs.read(testfolder, ["-isDir", "name"], function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
        expect(result.entries.length).toBe(8);
        expect(result.entries[0].name).toBe("alice");
        expect(result.entries[1].name).toBe("bob");
        expect(result.entries[2].name).toBe("carol");
        expect(result.entries[3].name).toBe("this");
        expect(result.entries[4].name).toBe("alice.txt");
        expect(result.entries[5].name).toBe("bob.txt");
        expect(result.entries[6].name).toBe("carol.txt");
        expect(result.entries[7].name).toBe("test.txt");
      });
    });
    it("cannot list entries from a non-existent folder", function(){
      runs(function(){
        done = false;
        whim.fs.read(testfolder+"/jabberwocky", ["-isDir", "name"], function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(false);
      });
    });
    
    it("can rename a file", function(){
      runs(function(){
        done = false;
        whim.fs.rename(testfolder+"/test.txt", testfolder+"/this/is/sparta.txt", function(r){
          if (r.success) {
            whim.fs.probe(testfolder+"/this/is/sparta.txt", function(r){
              if (r.success && r.properties.isFile) {
                whim.fs.probe(testfolder+"/test.txt", function(r){
                  result = r;
                  done = true;
                });
              }
            });
          }
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(false);
      });
    });
    it("can rename a folder", function(){
      runs(function(){
        done = false;
        whim.fs.rename(testfolder+"/this", testfolder+"/that", function(r){
          if (r.success) {
            whim.fs.probe(testfolder+"/that", function(r){
              if (r.success && r.properties.isDir) {
                whim.fs.probe(testfolder+"/this", function(r){
                  result = r;
                  done = true;
                });
              }
            });
          }
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(false);
      });
    });
    
    it("can copy a file", function(){
      runs(function(){
        done = false;
        whim.fs.copy(testfolder+"/that/is/sparta.txt", testfolder+"/test.txt", function(r){
          if (r.success) {
            whim.fs.probe(testfolder+"/that/is/sparta.txt", function(r){
              if (r.success && r.properties.isFile) {
                whim.fs.read(testfolder+"/test.txt", "utf8", function(r){
                  result = r;
                  done = true;
                });
              }
            });
          }
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
        expect(result.data).toBe("Små søde jordbær");
      });
    });
    it("can copy a folder", function(){
      runs(function(){
        done = false;
        whim.fs.copy(testfolder+"/that", testfolder+"/this", function(r){
          if (r.success) {
            whim.fs.probe(testfolder+"/that", function(r){
              if (r.success && r.properties.isDir) {
                whim.fs.probe(testfolder+"/this", function(r){
                  result = r;
                  done = true;
                });
              }
            });
          }
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
        expect(result.properties.isDir).toBe(true);
      });
    });
    
    it("can delete a file", function(){
      runs(function(){
        done = false;
        whim.fs.delete(testfolder+"/that/is/sparta.txt", function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
        expect(result.status).toBe("file deleted");
      });
    });
    it("can delete a non-existent file", function(){
      runs(function(){
        done = false;
        whim.fs.delete(testfolder+"/that/is/sparta.txt", function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
        expect(result.status).toBe("nothing to delete");
      });
    });
    
    it("can delete a folder recursively", function(){
      runs(function(){
        done = false;
        whim.fs.write(testfolder+"/test2.txt", "Små søde jordbær", "utf8", function(){
          whim.fs.write(testfolder+"/this/is/a/file.txt", "Små søde jordbær", "utf8", function(){
            whim.fs.write(testfolder+"/this/is/a/very/unusually/long/name/for/a/path", null, null, function(){
              whim.fs.delete(testfolder, function(r){
                result = r;
                done = true;
              });
            });
          });
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
        expect(result.status).toBe("directory deleted");
      });
    });
    it("can delete a non-existent folder", function(){
      runs(function(){
        done = false;
        whim.fs.delete(testfolder, function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
        expect(result.status).toBe("nothing to delete");
      });
    });
    
  });
}());