class ProgressBar {
    #canvas
    #gl
    #vertShaderSource
    #fragShaderSource
    #planeV
    #planeI
    #matOrto
    #translateRight
    #translateLeft 
    #scaleProg
    #program
    #u_tintAtribLoc
    #u_matAtribLoc
    #VBO 
    #VEO 
    #VAO

    #renderLoopActive    //1: render loop active | 0: render loop inactive
    #renderLoopRepeat    //1: render loop continues | 0: render loop breaks
    #flustrum            //flustrum dimensions

    drawCallsData       //rendering data
    clearColor          //color buffer will be wiped to this color


    constructor(canvas) {
        this.#canvas = canvas
        this.#gl = this.#canvas.getContext('webgl2')

        //drawcalls
        //pouzivam row major zaznam matic, pri vkladani do gl treba transponovat
        this.drawCallsData = [
            { translate: [1,0,0,0, 0,1,0,0, 0,0,1,-0.1, 0,0,0,1],
              scale: [1.85,0,0,0, 0,0.15,0,0, 0,0,1,0, 0,0,0,1],
              tint: [0.3,0.3,0.3,1],
              progress: 1.0
            },
            { translate: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
              scale: [1.8,0,0,0, 0,0.1,0,0, 0,0,1,0, 0,0,0,1],
              tint: [1,1,1,1],
              progress: 1.0
            }
        ]

        this.#vertShaderSource = 
            `#version 300 es

            layout(location = 0) in vec3 pos;

            uniform mat4 u_mat;

            void main()
            {
                gl_Position = u_mat * vec4(pos, 1.0);
            }`

        this.#fragShaderSource = 
            `#version 300 es
            precision mediump float;
        
            uniform vec4 u_tint;
        
            out vec4 color;
        
            void main()
            {
                color = u_tint;
            }`

        //mesh data
        this.#planeV = new Float32Array([
            //pos		    
            -.5, -.5, 0, 	
            .5, -.5, 0, 	
            .5, 0.5, 0, 	
            -.5, 0.5, 0])
        this.#planeI = new Uint16Array([
            0,1,2,
            0,2,3])

        //transformations
        this.#matOrto = [] //matrix of orto projection
        this.#translateRight = [1,0,0,0.5, 0,1,0,0, 0,0,1,0, 0,0,0,1]
        this.#translateLeft = [1,0,0,-0.5, 0,1,0,0, 0,0,1,0, 0,0,0,1]
        this.#scaleProg = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]

        //gl-shader
        this.#program
        this.#u_tintAtribLoc
        this.#u_matAtribLoc

        //gl-structures
        this.#VBO //vertex buffer object
        this.#VEO //vertex element buffer object
        this.#VAO //vertex array object

        //general-private
        this.#renderLoopActive = 0
        this.#renderLoopRepeat = 1
        this.#flustrum = [1/*r*/, 1/*t*/, -1/*f*/]

        //general public
        this.clearColor = [0, 0, 0]

        //initialization
        this.#matOrto = ProgressBar.Orto(this.#flustrum[0] /* * (this.#canvas.width / this.#canvas.height)*/, this.#flustrum[1], this.#flustrum[2])
        this.#BuildProgram(this.#vertShaderSource, this.#fragShaderSource)
        this.#CreateBuffers(this.#planeV, this.#planeI)
        this.#CreateVertexArray()

        this.#gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], 1)
        this.#gl.enable(this.#gl.DEPTH_TEST)

        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT)

        //window.onresize = () => { this.WindowResizeListener() }
        //this.WindowResizeListener()
    }

    FreeGl(){
        this.#gl.useProgram(null)

        this.#gl.deleteProgram(this.#program)
        this.#gl.deleteBuffer(this.#VBO)
        this.#gl.deleteBuffer(this.#VEO)
        this.#gl.deleteVertexArray(this.#VAO)

        /*
        console.log(this.#gl.getParameter(this.#gl.CURRENT_PROGRAM))
        console.log(this.#gl.getParameter(this.#gl.ARRAY_BUFFER_BINDING))
        console.log(this.#gl.getParameter(this.#gl.ELEMENT_ARRAY_BUFFER_BINDING))
        console.log(this.#gl.getParameter(this.#gl.VERTEX_ARRAY_BINDING))
        */
        /*
        console.log(this.#program)
        console.log(this.#VBO)
        console.log(this.#VEO)
        console.log(this.#VAO)
       */
    }

    WindowResizeListener(event){
        this.#canvas.width = window.innerWidth
        this.#canvas.height = window.innerHeight
    
        //this.#matOrto = ProgressBar.Orto(this.#flustrum[0] /* * (this.#canvas.width / this.#canvas.height)*/, this.#flustrum[1], this.#flustrum[2])
    }

    #BuildProgram(vertSource, fragSource){
        if (this.#program)
        {
            this.#gl.deleteProgram(this.#program)
        }

        this.#program = this.#GenerateProgram(
            this.#GenerateShader('v', vertSource), 
            this.#GenerateShader('f', fragSource))

        this.#u_tintAtribLoc = this.#gl.getUniformLocation(this.#program, "u_tint")
        this.#u_matAtribLoc = this.#gl.getUniformLocation(this.#program, "u_mat")
    }
    #GenerateProgram(vertShader, fragShader){
        const program = this.#gl.createProgram()
        const vshader = vertShader
        const fshader = fragShader
        
        this.#gl.attachShader(program, vshader)
        this.#gl.attachShader(program, fshader)
        this.#gl.linkProgram(program)
        
        if (!this.#gl.getProgramParameter(program, this.#gl.LINK_STATUS))
        {
            this.#gl.detachShader(program, vshader)
            this.#gl.detachShader(program, fshader)
            this.#gl.deleteShader(vshader)
            this.#gl.deleteShader(fshader)
            this.#gl.deleteProgram(program)
            throw 'Shader program lin failed.'
        }
        
        this.#gl.detachShader(program, vshader)
        this.#gl.detachShader(program, fshader)
        this.#gl.deleteShader(vshader)
        this.#gl.deleteShader(fshader)
        
        //console.log('Shader program created')
        return program
    }
    #GenerateShader(shaderType, shaderCode){
        let shader
        switch (shaderType)
        {
            case 'v':
                //console.log('Compiling vert shader')
                shader = this.#gl.createShader(this.#gl.VERTEX_SHADER)
                break
            case 'f':
                //console.log('Compiling frag shader')
                shader = this.#gl.createShader(this.#gl.FRAGMENT_SHADER)
                break
            default:
                throw 'Unknown shader type.'
        };
        
        this.#gl.shaderSource(shader, shaderCode)
        this.#gl.compileShader(shader)
        
        if (!this.#gl.getShaderParameter(shader, this.#gl.COMPILE_STATUS)) 
        {
            //console.log('shaderType ' + shaderType + ': ' + this.#gl.getShaderInfoLog(shader))
            this.#gl.deleteShader(shader)
            throw 'Shader compilation error.'
        }
        
        return shader
    }

    #CreateBuffers(vertData, idxData){
        this.#VBO = this.#gl.createBuffer()
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#VBO)
        this.#gl.bufferData(this.#gl.ARRAY_BUFFER, vertData, this.#gl.STATIC_DRAW)
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null)

        this.#VEO = this.#gl.createBuffer()
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, this.#VEO)
        this.#gl.bufferData(this.#gl.ELEMENT_ARRAY_BUFFER, idxData, this.#gl.STATIC_DRAW)
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, null)
    }

    #CreateVertexArray(){
        this.#VAO = this.#gl.createVertexArray()
        this.#gl.bindVertexArray(this.#VAO)
    
        //shader definet atrib. location for position
        const pos = 0
        
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, this.#VBO)
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, this.#VEO)

        this.#gl.vertexAttribPointer(pos, 3, this.#gl.FLOAT, false, 3 * 4, 0)
        this.#gl.enableVertexAttribArray(pos)

        this.#gl.bindVertexArray(null)

        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null)
        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, null)
        this.#gl.disableVertexAttribArray(pos)
    }

    DrawProgress(progress){
        this.drawCallsData[1].progress = Math.min(Math.max(progress, 0), 1)
        this.DrawFrame()
    }

    DrawFrame(){
        if (this.#gl.getParameter(this.#gl.CURRENT_PROGRAM) == null)
        {
            this.#gl.useProgram(this.#program)
        }
        if (this.#gl.getParameter(this.#gl.VERTEX_ARRAY_BINDING) == null)
        {
            this.#gl.bindVertexArray(this.#VAO)
        }

        this.#gl.viewport(0, 0, this.#canvas.width, this.#canvas.height)
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT)

        this.#Draw(this.drawCallsData[0])
        this.#Draw(this.drawCallsData[1])
    }

    #Draw(data) {
        this.#scaleProg[0] = data.progress
        let mat = ProgressBar.Mul4m(this.#translateRight, data.translate)
        mat = ProgressBar.Mul4m(this.#scaleProg, mat)
        mat = ProgressBar.Mul4m(this.#translateLeft, mat)
        mat = ProgressBar.Mul4m(data.scale, mat)
        mat = ProgressBar.Mul4m(this.#matOrto, mat)

        this.#gl.uniformMatrix4fv(this.#u_matAtribLoc, true, mat)
        this.#gl.uniform4fv(this.#u_tintAtribLoc, data.tint)

        this.#gl.drawElements(
            this.#gl.TRIANGLES, 
            this.#planeI.length, 
            this.#gl.UNSIGNED_SHORT,
            0)
    }

    RenderLoopState(){
        return this.#renderLoopActive;
    }

    RenderLoopStop(){
        this.#renderLoopRepeat = 0
    }

    RenderLoop(){
        if (this.#renderLoopActive == 1)
        {
            return
        }

        this.#renderLoopRepeat = 1
        this.#renderLoopActive = 1
        this.#gl.useProgram(this.#program)
        this.#gl.bindVertexArray(this.#VAO)

        const loop = () => {
            this.#gl.viewport(0, 0, this.#canvas.width, this.#canvas.height)
            this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT)

            this.#Draw(this.drawCallsData[0])
            this.#Draw(this.drawCallsData[1])

            if (this.#renderLoopRepeat == 1)
            {
                window.requestAnimationFrame(loop)
            }
            else
            {
                this.#renderLoopActive = 0
            }
        }

        loop();
    }

    SetColorBG(r, g, b) {
        this.clearColor[0] = r
        this.clearColor[1] = g
        this.clearColor[2] = b

        this.#gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], 1)
    }

    SetColorBorder(r, g, b) {
        this.drawCallsData[0].tint[0] = r
        this.drawCallsData[0].tint[1] = g
        this.drawCallsData[0].tint[2] = b
    }

    SetColorSlider(r, g, b) {
        this.drawCallsData[1].tint[0] = r
        this.drawCallsData[1].tint[1] = g
        this.drawCallsData[1].tint[2] = b
    }

    static Mul4m(matA, matB){
        //a rows * b cols
        let res = [];
        for (let r = 0; r < 4; r++) {
            for (let s = 0; s < 4; s++) {
                res[r * 4 + s] = 0;
                for (let t = 0; t < 4; t++) {
                    res[r * 4 + s] += (matA[4 * r + t] * matB[4 * t + s]) || 0;
                }
            }
        }
    
        return res;
    }

    static Orto(r, t, f) {
        return [
            1/r, 0, 0, 0, 
            0, 1/t, 0, 0, 
            0, 0, 1/f, 0, 
            0, 0, 0, 1]
    }
}