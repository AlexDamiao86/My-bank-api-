import express from 'express'; 
import { accountModel, db } from '../models/accountModel.js';

const app = express();

app.post('/deposit', async (req, res) => {
  const { agencia, conta, valorDeposito } = req.body; 
  
  try {

    if (Number(agencia) <= 0)
      throw new Error('Agencia informada inválida..');
    
    if (Number(conta) <=0)
      throw new Error('Conta informada inválida..');

    if (Number(valorDeposito) <= 0) 
      throw new Error('Valor a ser depositado deve ser maior que 0');

    const account = await accountModel.findOne({
      agencia: agencia, 
      conta: conta
    }).exec();

    if (!account) { 
      res.status(404).send({ error: 'Conta informada inexistente..' });
      return; 
    }

    const { _id, balance } = account; 
    const newBalance = balance + valorDeposito;

    const contaAtualizada = await accountModel.updateOne(
      { _id: _id }, 
      { balance: newBalance }
    );

    if (contaAtualizada.nModified === 0)
      throw new Error('Deposito nao realizado.. tente novamente')

    res.send({ balance: newBalance });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post('/withdraw', async (req, res) => {
  const { agencia, conta, valorSaque } = req.body; 
  const valorTarifaSaque = 1.00; 

  try {

    if (Number(agencia) <= 0)
      throw new Error('Agencia informada inválida..');
    
    if (Number(conta) <=0)
      throw new Error('Conta informada inválida..');

    if (Number(valorSaque) <= 0) 
      throw new Error('Valor a ser sacado deve ser maior que 0');

    const account = await accountModel.findOne({
      agencia: agencia, 
      conta: conta
    }).exec();

    if (!account) { 
      res.status(404).send({ error: 'Conta informada inexistente..' });
      return; 
    }

    const { _id, balance } = account;     
    const valorTotalSaque = Number(valorSaque) + valorTarifaSaque;
     
    if (valorTotalSaque > balance )  
      throw new Error(`Valor a ser sacado não pode ser maior que saldo (${balance})..`);

    const newBalance = balance - valorTotalSaque;

    const contaAtualizada = await accountModel.updateOne(
      { _id: _id }, 
      { balance: newBalance }
    );

    if (contaAtualizada.nModified === 0)
      throw new Error('Saque nao realizado.. tente novamente')

    res.send({ balance: newBalance });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Implementacao de transacao 
app.post('/transfer', async (req, res) => {
  const { 
    contaOrigem, 
    contaDestino, 
    valorTransferencia } = req.body; 
  const valorTarifaTransferencia = 8.00; 

  try {
    
    if (Number(contaOrigem) <=0)
      throw new Error('Conta de Origem informada inválida..');
    
    if (Number(contaDestino) <=0)
      throw new Error('Conta de Destino informada inválida..');

    if (Number(contaOrigem) === Number(contaDestino))
    throw new Error('Contas de origem e destino não podem ser iguais');

    if (Number(valorTransferencia) <= 0) 
      throw new Error('Valor a ser sacado deve ser maior que 0');

    // Inicia transacao 
    const session = await db.startSession();
    session.startTransaction();

    // Consulta a conta origem pelo numero e obtem id, agencia e balance
    const accountOrigin = await accountModel.findOne({
      conta: contaOrigem
    }).session(session);

    if (!accountOrigin) { 
      res.status(404).send({ error: 'Conta de Origem informada inexistente..' });
      return; 
    }

    const idOrigem = accountOrigin._id;
    const agenciaOrigem = accountOrigin.agencia;
    const balanceOrigem = accountOrigin.balance;

    // Consulta a conta destino pelo numero e obtem id, agencia e balance
    const accountTarget = await accountModel.findOne({
      conta: contaDestino
    }).session(session);

    if (!accountTarget) { 
      res.status(404).send({ error: 'Conta de Destino informada inexistente..' });
      return; 
    }
    
    const idDestino = accountTarget._id;
    const agenciaDestino = accountTarget.agencia;
    const balanceDestino = accountTarget.balance;

    let valorTotalTransferencia = 0; 

    // Taxa de transferencia de 8 reais caso transferencia para contas de 
    // agencias diferentes
    if (agenciaOrigem !== agenciaDestino) {
      valorTotalTransferencia = Number(valorTransferencia) + valorTarifaTransferencia;
    } else { 
      valorTotalTransferencia = Number(valorTransferencia)
    }

    if (valorTotalTransferencia > balanceOrigem )  
      throw new Error(`Valor a ser transferido não pode ser maior que saldo (${balanceOrigem})..`);

    const newBalanceOrigem = balanceOrigem - valorTotalTransferencia;
    const newBalanceDestino = balanceDestino + valorTransferencia;

    await accountModel.findByIdAndUpdate(
      { _id: idOrigem }, 
      { balance: newBalanceOrigem }
    ).session(session);
    
    await accountModel.findByIdAndUpdate(
      { _id: idDestino }, 
      { balance: newBalanceDestino }
    ).session(session);

    await session.commitTransaction();
    session.endSession();
    
    res.send({ balance: newBalanceOrigem });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get('/balance', async (req, res) => {
  const { agencia, conta } = req.body; 

  try {

    if (Number(agencia) <= 0)
      throw new Error('Agencia informada inválida..');
    
    if (Number(conta) <=0)
      throw new Error('Conta informada inválida..');

    const account = await accountModel.findOne({
      agencia: agencia, 
      conta: conta
    }).exec();

    if (!account) { 
      res.status(404).send({ error: 'Conta informada inexistente..' });
      return; 
    }

    const { balance } = account;

    res.send({ balance });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.delete('/', async (req, res) => {
  const { agencia, conta } = req.body; 

  try {

    if (Number(agencia) <= 0)
      throw new Error('Agencia informada inválida..');
    
    if (Number(conta) <=0)
      throw new Error('Conta informada inválida..');

    const account = await accountModel.findOneAndDelete({
      agencia: agencia, 
      conta: conta
    }).exec();

    if (!account) { 
      res.status(404).send({ error: 'Conta informada inexistente..' });
      return; 
    }

    const contasAposDelecao = await accountModel.find({ 
      agencia: agencia 
    }).exec();

    res.send({ contasAtivasAgencia: contasAposDelecao.length });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get('/average/:agencia', async (req, res) => {
  try { 
    const numeroAgencia = Number(req.params.agencia);

    const accounts = await accountModel.find({
      agencia: numeroAgencia
    });

    let sumBalance = accounts.reduce(function (acc, cur) {
      return acc + cur.balance; 
    }, 0);

    const averageBalance = sumBalance / accounts.length;

    res.send({ averageBalance: Number(averageBalance.toFixed(2)) });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get('/lowest/:qt', async (req, res) => {
  function compare(a, b) {
    return a.balance - b.balance;
  }
  try {
    const qtdeClientes = Number(req.params.qt);

    let accounts = await accountModel.find({});

    accounts = accounts.map(account => ({ 
      agencia: account.agencia, 
      conta: account.conta,
      balance: account.balance
    }))
    accounts.sort(compare);
    accounts = accounts.slice(0, qtdeClientes);

    res.send(accounts);

  } catch(err) {
    res.status(500).send({ error: err.message });
  }
});

app.get('/highest/:qt', async (req, res) => {
  function compare(a, b) {
    return b.balance - a.balance || a.name.localeCompare(b.name);
  }
  try {
    const qtdeClientes = Number(req.params.qt);

    let accounts = await accountModel.find({});

    accounts = accounts.map(account => ({ 
      agencia: account.agencia, 
      conta: account.conta,
      name: account.name, 
      balance: account.balance
    }))
    accounts.sort(compare);
    accounts = accounts.slice(0, qtdeClientes);

    res.send(accounts);

  } catch(err) {
    res.status(500).send({ error: err.message });
  }
});

// Alterar a agencia das contas da lista private para 99 
// Implementacao de transacao
app.get('/private', async (req, res) => {
  function compare(a, b) {
    return b.balance - a.balance || a.name.localeCompare(b.name);;
  }
  function groupBy(key) { 
    return function group(array) {
      return array.reduce((acc, obj) => {
        const property = obj[key];
        acc[property] = acc[property] || [];
        acc[property].push(obj);
        return acc;
      }, {});
    };
  }

  try { 
    const accounts = await accountModel.find({});

    const groupByBranch = groupBy('agencia');
    const accountsByBranch = groupByBranch(accounts);
    const privateClients = []

    for (let agencia in accountsByBranch) {
      accountsByBranch[agencia].sort(compare);
      privateClients.push(accountsByBranch[agencia][0]);
    }

    res.send(privateClients);
  } catch(err) {
    res.status(500).send({ error: err.message });
  }
});

app.get('/', async (req, res) => {
  const account = await accountModel.find({});

  try {
    res.send(account);
  } catch(err) {
    res.status(500).send({ error: err.message });
  }
});

export { app as accountRouter };