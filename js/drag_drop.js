

function makeWindowDragable(window) {
  function clickDragableElement(element) {
    // Bring forth the clicked window
    if (document.current_seleted) {
      document.current_seleted.style.zIndex = 1;
      document.current_seleted.style.boxShadow = "none";
    }
    document.current_seleted = window;
    window.style.zIndex = 3;
    window.style.boxShadow = "10px 10px";

    document.onmousemove = dragDragableElement;
    /*element.srcElement.onmouseleave = function () {
      document.onmousemove = null;
      console.log("out");
    };*/

    window.start_pos_x = element.clientX;
    window.start_pos_y = element.clientY;
  }

  function dragDragableElement(element) {
    var el = window;
    const new_x = el.start_pos_x - element.clientX;
    const new_y = el.start_pos_y - element.clientY;
    el.start_pos_x = element.clientX;
    el.start_pos_y = element.clientY;
    el.style.left = (el.offsetLeft - new_x) + "px";
    el.style.top = (el.offsetTop - new_y) + "px";
  }

  function releaseDragableElement(element) {
    document.onmousemove = null;
  }

  var title_div = window.querySelector(".window_title");

  title_div.onmousedown = clickDragableElement;
  title_div.onmouseup = releaseDragableElement;
}

function pressCloseWindow(element) {
  function on_click(e) {
    document.getElementById(element.attributes.parent_id.nodeValue).style.visibility = "hidden";
  }

  element.addEventListener("click", on_click);
}

export {makeWindowDragable, pressCloseWindow};
