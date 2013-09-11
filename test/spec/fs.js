/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true,
undef:true, unused:true, curly:true, devel:true, indent:2, maxerr:50, newcap:true, browser:true, jquery: true */
/*global fs, describe, it, runs, waitsFor, expect, jasmine*/
(function(){
  "use strict";
  describe("fs.js", function(){
    var done, result;
    var testfolder = "[code]/test" + Math.random();
    
    it("can list root", function(){
      runs(function(){
        done = false;
        fs.listDir("/", function(r){
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
        fs.makeDir("/", function(r){
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
        fs.makeDir(testfolder, function(r){
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
        fs.removeDir(testfolder, function(r){
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
        fs.makeDir(testfolder+"/this/is/a/very/long/path", function(r){
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
        fs.writeTextFile(testfolder+"/test.txt", "Små søde jordbær", function(r){
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
        fs.readTextFile(testfolder+"/test.txt", function(r){
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
        fs.getProps(testfolder+"/test.txt", function(r){
          result = r;
          done = true;
        });
      });
      
      waitsFor(function(){
        return done;
      });
      
      runs(function(){
        expect(result.success).toBe(true);
        expect(result.props.name).toBe("test.txt");
        expect(result.props.isFile).toBe(true);
        expect(result.props.isDir).toBe(false);
        expect(result.props.isLink).toBe(false);
        expect(result.props.size).toEqual(jasmine.any(Number));
        expect(result.props.atime).toEqual(jasmine.any(Date));
        expect(result.props.ctime).toEqual(jasmine.any(Date));
        expect(result.props.mtime).toEqual(jasmine.any(Date));
      });
    });
    
    it("can list entries from a folder in specified order", function(){
      var setup = 6;
      runs(function(){
        fs.makeDir(testfolder+"/carol", function(){ setup--; });
        fs.makeDir(testfolder+"/bob", function(){ setup--; });
        fs.writeTextFile(testfolder+"/bob.txt",   "the builder..", function(){ setup--; });
        fs.writeTextFile(testfolder+"/alice.txt", "in wonderland!", function(){ setup--; });
        fs.makeDir(testfolder+"/alice", function(){ setup--; });
        fs.writeTextFile(testfolder+"/carol.txt", "I am but a fool...", function(){ setup--; });
      });
      
      waitsFor(function(){
        return setup === 0;
      });
      
      runs(function(){
        done = false;
        fs.listDir(testfolder, ["-isDir", "name"], function(r){
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
        fs.listDir(testfolder+"/jabberwocky", ["-isDir", "name"], function(r){
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
        fs.rename(testfolder+"/test.txt", "this/is/sparta.txt", function(r){
          if (r.success) {
            fs.getProps(testfolder+"/this/is/sparta.txt", function(r){
              if (r.success && r.props.isFile) {
                fs.getProps(testfolder+"/test.txt", function(r){
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
        fs.rename(testfolder+"/this", "that", function(r){
          if (r.success) {
            fs.getProps(testfolder+"/that", function(r){
              if (r.success && r.props.isDir) {
                fs.getProps(testfolder+"/this", function(r){
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
        fs.copy(testfolder+"/that/is/sparta.txt", "../../test.txt", function(r){
          if (r.success) {
            fs.getProps(testfolder+"/that/is/sparta.txt", function(r){
              if (r.success && r.props.isFile) {
                fs.readTextFile(testfolder+"/test.txt", function(r){
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
        fs.copy(testfolder+"/that", "this", function(r){
          if (r.success) {
            fs.getProps(testfolder+"/that", function(r){
              if (r.success && r.props.isDir) {
                fs.getProps(testfolder+"/this", function(r){
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
        expect(result.props.isDir).toBe(true);
      });
    });
    
    it("can delete a file", function(){
      runs(function(){
        done = false;
        fs.deleteFile(testfolder+"/that/is/sparta.txt", function(r){
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
        fs.deleteFile(testfolder+"/that/is/sparta.txt", function(r){
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
        fs.writeTextFile(testfolder+"/test2.txt", "Små søde jordbær", function(){
          fs.writeTextFile(testfolder+"/this/is/a/file.txt", "Små søde jordbær", function(){
            fs.makeDir(testfolder+"/this/is/a/very/unusually/long/name/for/a/path", function(){
              fs.removeDir(testfolder, function(r){
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
        fs.removeDir(testfolder, function(r){
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