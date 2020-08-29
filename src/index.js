import express from 'express'; 
import mongoose from 'mongoose'; 
import { accountRouter } from './routes/accountRoutes.js';
import cors from 'cors';

// Iniciando o App
const app = express();

// Liberar que a API seja chamada a partir de qualquer aplicação
app.use(cors());

const uri = process.env.PROTOCOL
        + process.env.USERNAME + ":"
        + process.env.PASSWORD 
        + process.env.HOSTNAME  
        + process.env.DBNAME 
        + "?retryWrites=true&w=majority"; 

// Iniciando o DB 
(async () => { 
  try { 
    await mongoose.connect(
      uri, 
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    ) 
    console.log('Conectado com o banco de dados!');
  } catch(err) {
    console.log('Erro ao conectar com o banco de dados...\n' + err)
  } 
})();

app.use(express.json());
app.use('/accounts', accountRouter);

app.listen(process.env.PORT, () => {
  console.log('API has started!');
})



