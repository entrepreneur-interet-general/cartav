<template>
  <div id="modal">
    <h3><slot name="title">default title</slot></h3>
    <p><slot name="text">default text</slot></p>
    <button class="btn btn-default" @click="$emit('close')">
      OK
    </button>
  </div>
</template>

<style>
  #modal {
    border: 1px solid grey;
    border-radius: 5px;
    background-color: white;
    padding: 10px;
    z-index: 2000;
    position: absolute;
    top: 100px;
    text-align: center;
    width: 40%;
    left: 30%;
  }

  p {
    font-size: 16px;
  }

  #modal.black {
    background-color: black;
    border: 2px solid orange;
    color: red;
  }
</style>
