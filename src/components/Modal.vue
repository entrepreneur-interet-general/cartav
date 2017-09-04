<template>
  <div id="modal" class="bg-info">
    <h3><slot name="title">default title</slot></h3>
    <p><slot name="text">default text</slot></p>
    <button class="modal-default-button" @click="$emit('close')">
      OK
    </button>
  </div>
</template>

<style>
  #modal {
    border: 1px solid black;
    border-radius: 25px;
    padding: 10px;
    z-index: 2000;
    position: absolute;
    top: 100px;
    text-align: center;
    width: 40%;
    left: 30%;
  }
</style>
