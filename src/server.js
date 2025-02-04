import express from 'express'
import cors from 'cors'
import 'dotenv/config'



const app = express()
const port = 3000
app.use(express.json())
app.use(cors({
    origin: ['https://expens-io.vercel.app', 'https://expens-f1wr3rddk-lei-pinheiros-projects.vercel.app']
}))




app.listen(port, () => console.log('Servidor rodando na porta:', port))

