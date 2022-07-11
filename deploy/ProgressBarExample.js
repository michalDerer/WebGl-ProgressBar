let progressBar = new ProgressBar(document.getElementById('canvas'))

progressBar.SetColorBG(0, 0, 0)
progressBar.SetColorBorder(0.3, 0.3, 0.3)
progressBar.SetColorSlider(1, 1, 1)

//progressBar.WindowResizeListener()
progressBar.RenderLoop()


//------------------------------------------------------------------------------------------------


//to update rendering for new window size (changed canvas resolution), set listener on window resize event
//window.onresize = () => { progressBar.WindowResizeListener() }

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


function StartRenderLoop(){
    progressBar.RenderLoop()
}

function StopRenderLoop(){
    progressBar.RenderLoopStop()
}

function DrawFrame(){
    progressBar.DrawFrame()
}

function UpdateProgressAndDrawFrame(){
    progressBar.DrawProgress(progressBar.drawCallsData[1].progress + 0.07)
}

function Free(){
    //render loop need to be stopped first, draw calls affterwards will result in errors
    progressBar.FreeGl()
}