import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  agencia: { 
    type: Number, 
    required: true
  }, 
  conta: { 
    type: Number, 
    required: true
  }, 
  name: { 
    type: String, 
    required: true
  }, 
  balance: { 
    type: Number, 
    required: true, 
    validate(balance) {
      if (balance < 0) throw new Error('Valor saldo deve ser maior ou igual a 0')
    },
  }
})

const accountModel = mongoose.model('account', accountSchema);

export { accountModel };