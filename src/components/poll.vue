<template>
  <div id="poll">
    <div>
      <p>Nous avons besoin de votre aide pour trouver le nom de l'outil.
      <a href="http://planif-mgmsic.ader.gouv.fr/studs.php?poll=i9PELPZucxN7KSKU" target="blank"><button type="button" class="btn btn-success">Votez !</button></a>
      </p>
    </div>
  </div>
</template>

<style>
  #poll {
    z-index: 2000;
    position: absolute;
    bottom: 0;
    right: 0;
    left: 0;
    text-align: center;
  }
  #poll > div {
    background-color: white;
    display: inline-block;
    padding-left: 5px;
    padding-right: 5px;
    padding-top: 5px;
    border-radius: 5px;
    border: 2px solid green;
  }
</style>