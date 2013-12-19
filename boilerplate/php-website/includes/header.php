<?php
  function xq($s) { return htmlspecialchars($s); }
  function uq($s) { return urlencode($s); }
?><!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?=xq($title)?> - My PHP-website</title>
    <link rel="stylesheet" href="css/style.css" type="text/css" media="all" />
  </head>
  <body>
    <div id="wrapper">
      <header>
        <h1>My PHP-website</h1>
      </header>
      <?php include("navigation.php"); ?>
      <main>
