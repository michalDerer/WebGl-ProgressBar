let progressBar = new ProgressBar(document.getElementById('canvas'))

progressBar.WindowResizeListener()
progressBar.RenderLoop()

function StartRenderLoop(){
    progressBar.RenderLoop()
}

function StopRenderLoop(){
    progressBar.renderLoopRepeat = 0;
}

function DrawFrame(){
    progressBar.DrawFrame();
}

function UpdateProgressAndDrawFrame(){
    progressBar.DrawProgress(progressBar.drawCallsData[1].progress + 0.07)
}

//------------------------------------------------------------------------------------------------

//to update rendering for new window size (changed canvas resolution), set listener on window resize event
window.onresize = () => { progressBar.WindowResizeListener() }

//event listener for progress update
const progressl = (event) => {
    progressl.textElement.innerText = 'Progress: ' + event.srcElement.value
	progressl.progressBar.drawCallsData[1].progress = Number.parseFloat(event.srcElement.value)
}

//hooking progressBar into event listener
progressl.progressBar = progressBar

//linking event listener with UI
progressl.textElement = document.getElementById('progresst')
document.getElementById('progresss').addEventListener('input', progressl)

//calling event listener for initialization
progressl({'srcElement': document.getElementById('progresss')})

//------------------------------------------------------------------------------------------------

