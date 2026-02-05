const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- CORREÇÃO 1: Servir arquivos da pasta onde o server.js está (pasta 'ttk') ---
app.use(express.static(__dirname));

// --- CORREÇÃO 2: Buscar o config.json na pasta "pai" (../config.json) ---
let config;
// __dirname é a pasta atual ('ttk'). '../' sobe um nível para 'TTK-REWARDS'
const configPath = path.join(__dirname, './config.json');

try {
    if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(configFile);
        console.log('✅ Configurações carregadas de:', configPath);
    } else {
        console.error('❌ ERRO: config.json não encontrado no caminho:', configPath);
        console.error('Certifique-se que o arquivo config.json está na pasta raiz (fora da pasta ttk).');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Erro ao ler config.json:', error.message);
    process.exit(1);
}

// ROTA DA API (Mesma lógica de antes)
app.post('/api/create-transaction', async (req, res) => {
    console.log('🔄 Recebendo pedido de transação...');

    try {
        const transactionId = 'txn_' + Date.now();

        // Pega dados do config.json
        const payload = {
            amount: config.payment.amount,
            description: config.payment.description,
            transactionId: transactionId,
            payerName: req.body.payerName || config.payment.payerName,
            payerDocument: req.body.payerDocument || config.payment.payerCpf
        };

        const response = await axios.post(
            `${config.misticpay.apiBaseUrl}/transactions/create`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'ci': config.misticpay.clientId,
                    'cs': config.misticpay.clientSecret
                }
            }
        );

        console.log('✅ PIX Gerado com sucesso!');
        res.json(response.data);

    } catch (error) {
        console.error('❌ Erro na API MisticPay:');
        if (error.response) {
            console.error(error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error(error.message);
            res.status(500).json({ message: 'Erro interno.' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando dentro da pasta 'ttk'!`);
    console.log(`📂 Lendo config de: ${configPath}`);
    // Se você quer abrir o safeprotect.html, o link é este:
    console.log(`👉 Acesse: http://localhost:${PORT}/safeprotect.html\n`);
});