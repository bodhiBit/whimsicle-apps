<?php
  $error = false;
  if ($_SERVER["REQUEST_METHOD"] === "POST") {
    if ($_POST["name"] && $_POST["email"] && $_POST["message"]) {
      $success = mail("myEmail@example.com",
        "Message from ".$_POST["name"]." <".$_POST["email"].">",
        $_POST["message"]);
      if ($success) {
        $error = "Thanks! I will get back to you. :)";
      } else {
        $error = "Something went wrong. :(";
      }
    } else {
      $error = "Sorry. You must fill out all fields to send a message.";
    }
  }
  $title = "Contact";
  include("includes/header.php");
?>
        <h1>Contact me here</h1>
        <?php if ($error): ?> 
          <p class="error"><?=xq($error)?></p>
        <?php endif; ?> 
        <form method="post" action="" target="_self">
          <table>
            <tr>
              <th><label for="nameInp">Name:</label></th>
              <td><input required type="text" id="nameInp" name="name" /></td>
            </tr>
            <tr>
              <th><label for="emailInp">E-mail:</label></th>
              <td><input required type="email" id="Inp" name="email" /></td>
            </tr>
            <tr>
              <th><label for="messageInp">Message:</label></th>
              <td><textarea required id="messageInp" name="message" ></textarea></td>
            </tr>
            <tr>
              <th></th>
              <td><input type="submit" id="submitInp" value="Send!" /></td>
            </tr>
          </table>
        </form>
<?php
  include("includes/footer.php");
?>