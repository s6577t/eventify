function deventify (object) {

  for (var member in object) {
    if (object[member] && object[member].__eventifyEvent) {
      object[member]().unbindAll();
    }
  }

  return object;
}