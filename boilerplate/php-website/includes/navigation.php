<?php
  $nav = array(
      "./" => "Home",
      "about.php" => "About me",
      "contact.php" => "Contact"
    );
  $here = max(0, array_search(basename($_SERVER["SCRIPT_NAME"]), array_keys($nav)));
?> 
    <nav>
      <ul><?php foreach($nav as $href => $label): ?> 
        <li<?=$here===0?' class="current"':''?>><a href="<?=xq($href)?>"><?=xq($label)?></a></li>
      <?php $here--; endforeach; ?></ul>
    </nav>
