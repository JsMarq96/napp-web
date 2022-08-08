
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function init_clock_animation() {
  var clock = document.getElementById("clock");

  (async function run_clock() {
    const curr_time = new Date();
    clock.innerHTML = curr_time.getHours() + ":" + curr_time.getMinutes();
    await sleep(30 * 1000); // update avery half a minute
    requestAnimationFrame(run_clock);
  })();
}

export { init_clock_animation }; 
