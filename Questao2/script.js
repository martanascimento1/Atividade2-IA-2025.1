// Estruturas de dados para a base de conhecimento
let knowledgeBase = {
    rules: [],
    facts: [],
    goals: []
};
let inferenceTrace = [];
let lastInferenceResult = null;
// Sistema de abas
function switchTab(panel, tabName) {
    const tabs = document.querySelectorAll(`#${panel} .tab`);
    const panels = document.querySelectorAll(`#${panel}-${tabName.split('-')[0]} .tab-panel`);
    tabs.forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll(`.tab-panel`).forEach(panel => panel.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`${panel}-${tabName}`).classList.add('active');
}
// Funções para gerenciar regras
function addRule() {
    const condition = document.getElementById('ruleCondition').value.trim();
    const conclusion = document.getElementById('ruleConclusion').value.trim();
    const certainty = parseFloat(document.getElementById('ruleCertainty').value);
    if (!condition || !conclusion) {
        alert('Por favor, preencha condição e conclusão da regra.');
        return;
    }
    const rule = {
        id: Date.now(),
        condition: condition,
        conclusion: conclusion,
        certainty: certainty
    };
    knowledgeBase.rules.push(rule);
    updateRulesList();
    clearRuleInputs();
}
function deleteRule(id) {
    knowledgeBase.rules = knowledgeBase.rules.filter(rule => rule.id !== id);
    updateRulesList();
}
function updateRulesList() {
    const list = document.getElementById('rulesList');
    list.innerHTML = knowledgeBase.rules.map(rule => `
        <div class="rule-item">
            <button class="delete-btn" onclick="deleteRule(${rule.id})">×</button>
            <strong>SE</strong> ${rule.condition} <strong>ENTÃO</strong> ${rule.conclusion}
            <br><small>Certeza: ${rule.certainty}</small>
        </div>
    `).join('');
}
function clearRuleInputs() {
    document.getElementById('ruleCondition').value = '';
    document.getElementById('ruleConclusion').value = '';
    document.getElementById('ruleCertainty').value = '1.0';
}
// Funções para gerenciar fatos
function addFact() {
    const fact = document.getElementById('factInput').value.trim();
    const certainty = parseFloat(document.getElementById('factCertainty').value);
    if (!fact) {
        alert('Por favor, insira um fato.');
        return;
    }
    const factObj = {
        id: Date.now(),
        fact: fact,
        certainty: certainty
    };
    knowledgeBase.facts.push(factObj);
    updateFactsList();
    clearFactInputs();
}
function deleteFact(id) {
    knowledgeBase.facts = knowledgeBase.facts.filter(fact => fact.id !== id);
    updateFactsList();
}
function updateFactsList() {
    const list = document.getElementById('factsList');
    list.innerHTML = knowledgeBase.facts.map(fact => `
        <div class="fact-item">
            <button class="delete-btn" onclick="deleteFact(${fact.id})">×</button>
            ${fact.fact}
            <br><small>Certeza: ${fact.certainty}</small>
        </div>
    `).join('');
}
function clearFactInputs() {
    document.getElementById('factInput').value = '';
    document.getElementById('factCertainty').value = '1.0';
}
// Funções para gerenciar objetivos
function addGoal() {
    const goal = document.getElementById('goalInput').value.trim();
    if (!goal) {
        alert('Por favor, insira um objetivo.');
        return;
    }
    const goalObj = {
        id: Date.now(),
        goal: goal
    };
    knowledgeBase.goals.push(goalObj);
    updateGoalsList();
    document.getElementById('goalInput').value = '';
}
function deleteGoal(id) {
    knowledgeBase.goals = knowledgeBase.goals.filter(goal => goal.id !== id);
    updateGoalsList();
}
function updateGoalsList() {
    const list = document.getElementById('goalsList');
    list.innerHTML = knowledgeBase.goals.map(goal => `
        <div class="fact-item">
            <button class="delete-btn" onclick="deleteGoal(${goal.id})">×</button>
            ${goal.goal}
        </div>
    `).join('');
}
// Motor de Inferência - Encadeamento para Frente
function forwardChaining() {
    const query = document.getElementById('queryInput').value.trim();
    if (!query) {
        alert('Por favor, insira uma consulta.');
        return;
    }
    inferenceTrace = [];
    const derivedFacts = [...knowledgeBase.facts];
    let newFactsAdded = true;
    inferenceTrace.push('=== ENCADEAMENTO PARA FRENTE ===');
    inferenceTrace.push(`Consulta: ${query}`);
    inferenceTrace.push('Fatos iniciais: ' + knowledgeBase.facts.map(f => f.fact).join(', '));
    while (newFactsAdded) {
        newFactsAdded = false;
        for (const rule of knowledgeBase.rules) {
            if (canApplyRule(rule, derivedFacts)) {
                const conclusion = rule.conclusion;
                if (!derivedFacts.find(f => f.fact === conclusion)) {
                    derivedFacts.push({
                        fact: conclusion,
                        certainty: rule.certainty,
                        derivedFrom: rule.id
                    });
                    newFactsAdded = true;
                    inferenceTrace.push(`Aplicando regra: SE ${rule.condition} ENTÃO ${rule.conclusion}`);
                    inferenceTrace.push(`Novo fato derivado: ${conclusion}`);
                }
            }
        }
    }
    const result = derivedFacts.find(f => f.fact === query);
    if (result) {
        inferenceTrace.push(`✅ RESULTADO: ${query} é VERDADEIRO (certeza: ${result.certainty})`);
        displayInferenceResult(true, query, result.certainty);
    } else {
        inferenceTrace.push(`❌ RESULTADO: ${query} NÃO PODE SER PROVADO`);
        displayInferenceResult(false, query);
    }
    displayInferenceSteps();
    lastInferenceResult = { query, result: !!result, certainty: result?.certainty || 0 };
}
// Motor de Inferência - Encadeamento para Trás
function backwardChaining() {
    const query = document.getElementById('queryInput').value.trim();
    if (!query) {
        alert('Por favor, insira uma consulta.');
        return;
    }
    inferenceTrace = [];
    inferenceTrace.push('=== ENCADEAMENTO PARA TRÁS ===');
    inferenceTrace.push(`Objetivo: ${query}`);
    const result = proveGoal(query, []);
    if (result) {
        inferenceTrace.push(`✅ RESULTADO: ${query} é VERDADEIRO (certeza: ${result.certainty})`);
        displayInferenceResult(true, query, result.certainty);
    } else {
        inferenceTrace.push(`❌ RESULTADO: ${query} NÃO PODE SER PROVADO`);
        displayInferenceResult(false, query);
    }
    displayInferenceSteps();
    lastInferenceResult = { query, result: !!result, certainty: result?.certainty || 0 };
}
function proveGoal(goal, visited) {
    if (visited.includes(goal)) {
        inferenceTrace.push(`⚠️ Ciclo detectado para: ${goal}`);
        return null;
    }
    const fact = knowledgeBase.facts.find(f => f.fact === goal);
    if (fact) {
        inferenceTrace.push(`✓ Fato encontrado: ${goal} (certeza: ${fact.certainty})`);
        return fact;
    }
    visited.push(goal);
    for (const rule of knowledgeBase.rules) {
        if (rule.conclusion === goal) {
            inferenceTrace.push(`Tentando usar regra: SE ${rule.condition} ENTÃO ${rule.conclusion}`);
            if (proveCondition(rule.condition, visited.slice())) {
                inferenceTrace.push(`✓ Regra aplicada com sucesso para: ${goal}`);
                visited.pop();
                return { fact: goal, certainty: rule.certainty };
            }
        }
    }
    visited.pop();
    inferenceTrace.push(`✗ Não foi possível provar: ${goal}`);
    return null;
}
function proveCondition(condition, visited) {
    const conditions = condition.split(' e ').map(c => c.trim());
    for (const cond of conditions) {
        if (!proveGoal(cond, visited)) {
            return false;
        }
    }
    return true;
}
function canApplyRule(rule, facts) {
    const conditions = rule.condition.split(' e ').map(c => c.trim());
    return conditions.every(cond => facts.find(f => f.fact === cond));
}
function displayInferenceResult(success, query, certainty = 0) {
    const resultDiv = document.getElementById('inferenceResult');
    resultDiv.innerHTML = `
        <div class="inference-result">
            <h3>${success ? '✅ Resultado Positivo' : '❌ Resultado Negativo'}</h3>
            <p><strong>Consulta:</strong> ${query}</p>
            ${success ? `<p><strong>Fator de Certeza:</strong> ${certainty}</p>` : ''}
            <p><strong>Status:</strong> ${success ? 'PROVADO' : 'NÃO PROVADO'}</p>
        </div>
    `;
}
function displayInferenceSteps() {
    const stepsDiv = document.getElementById('inferenceSteps');
    stepsDiv.innerHTML = `
        <div class="inference-steps">
            <h4>Passos da Inferência:</h4>
            ${inferenceTrace.map(step => `<div>${step}</div>`).join('')}
        </div>
    `;
}
// Sistema de Chat em Linguagem Natural
function handleChatEnter(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}
function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    addChatMessage(message, 'user');
    input.value = '';
    setTimeout(() => {
        const response = processNaturalLanguage(message);
        addChatMessage(response, 'system');
    }, 500);
}
function addChatMessage(message, type) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
function processNaturalLanguage(message) {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('é') && (lowerMessage.includes('?') || lowerMessage.includes('verdade'))) {
        const patterns = [
            /(.+?)\s+é\s+(.+?)[\?]?/,
            /o\s+(.+?)\s+é\s+(.+?)[\?]?/,
            /a\s+(.+?)\s+é\s+(.+?)[\?]?/
        ];
        for (const pattern of patterns) {
            const match = lowerMessage.match(pattern);
            if (match) {
                const subject = match[1].trim();
                const predicate = match[2].trim();
                const query = `${predicate}(${subject})`;
                return checkFactInKnowledgeBase(query);
            }
        }
    }
    if (lowerMessage.includes('por que') || lowerMessage.includes('porque')) {
        return 'Para explicações detalhadas, use a aba "Explanação" e selecione "Por quê?". Posso explicar como cheguei a uma conclusão específica.';
    }
    if (lowerMessage.includes('como')) {
        return 'Para entender como uma conclusão foi derivada, use a aba "Explanação" e selecione "Como?". Mostrarei os passos do raciocínio.';
    }
    if (lowerMessage.includes('fatos') || lowerMessage.includes('o que você sabe')) {
        const facts = knowledgeBase.facts.map(f => f.fact).join(', ');
        return facts ? `Conheço os seguintes fatos: ${facts}` : 'Não tenho fatos na base de conhecimento ainda.';
    }
    if (lowerMessage.includes('regras')) {
        const rules = knowledgeBase.rules.map(r => `SE ${r.condition} ENTÃO ${r.conclusion}`).join('; ');
        return rules ? `Tenho as seguintes regras: ${rules}` : 'Não tenho regras definidas ainda.';
    }
    return 'Não entendi sua pergunta. Tente perguntar algo como "O leão é um predador?" ou "Que fatos você conhece?". Você também pode usar as outras abas para consultas mais específicas.';
}
function checkFactInKnowledgeBase(query) {
    const directFact = knowledgeBase.facts.find(f => f.fact === query);
    if (directFact) {
        return `Sim, ${query} é verdadeiro com certeza ${directFact.certainty}.`;
    }
    return 'Não encontrei esse fato na base de conhecimento.';
}

// ... (código anterior mantido)

// Gera a explicacao com base na escolha do usuario
function generateExplanation() {
    const type = document.getElementById('explanationType').value;
    const query = document.getElementById('explainInput').value.trim();

    if (!query) {
        alert('Por favor, insira um fato ou conclusão para explicar.');
        return;
    }

    if (type === 'why') {
        whyExplanation(query);
    } else if (type === 'how') {
        howExplanation(query);
    }
}

// Explicacao "Por que?" - Justifica a crença na conclusão
function whyExplanation(query) {
    let explanationHTML = `<h3>Explicando: Por que '${query}'?</h3>`;

    // Verifica se o fato está diretamente na base de fatos
    const directFact = knowledgeBase.facts.find(f => f.fact === query);
    if (directFact) {
        explanationHTML += `
            <div class="explanation-box">
                <p>Eu acredito em <strong>${query}</strong> porque este fato foi diretamente inserido na base de conhecimento.</p>
                <p>Fator de certeza: ${directFact.certainty}</p>
            </div>
        `;
        document.getElementById('explanationResult').innerHTML = explanationHTML;
        return;
    }

    // Caso não esteja diretamente na base, procurar nas regras
    const rulesThatSupport = knowledgeBase.rules.filter(r => r.conclusion === query);
    if (rulesThatSupport.length === 0) {
        explanationHTML += `
            <div class="explanation-box">
                <p>Eu <strong>não tenho informações suficientes</strong> para acreditar em '${query}'.</p>
                <p>Nem fatos diretos, nem regras que o provem foram encontrados.</p>
            </div>
        `;
        document.getElementById('explanationResult').innerHTML = explanationHTML;
        return;
    }

    // Verificar se os antecedentes dessas regras estão satisfeitos
    let foundJustification = false;
    for (const rule of rulesThatSupport) {
        const conditions = rule.condition.split(' e ').map(c => c.trim());
        const satisfiedConditions = conditions.filter(cond => knowledgeBase.facts.find(f => f.fact === cond));

        if (satisfiedConditions.length === conditions.length) {
            foundJustification = true;
            explanationHTML += `
                <div class="explanation-box">
                    <p>Eu acredito em <strong>${query}</strong> porque:</p>
                    <ul>
                        ${satisfiedConditions.map(c => `<li>Fato conhecido: ${c}</li>`).join('')}
                    </ul>
                    <p>E pela regra:</p>
                    <p><strong>SE</strong> ${rule.condition} <strong>ENTÃO</strong> ${rule.conclusion}</p>
                    <p>Fator de certeza da regra: ${rule.certainty}</p>
                </div>
            `;
        }
    }

    if (!foundJustification) {
        explanationHTML += `
            <div class="explanation-box">
                <p>Existe(m) regra(s) que <strong>poderiam provar</strong> '${query}', mas não possuo todos os fatos necessários para aplicá-las.</p>
            </div>
        `;
    }

    document.getElementById('explanationResult').innerHTML = explanationHTML;
}

// Explicacao "Como?" - Mostra os passos usados na inferencia (a ser implementado)
function howExplanation(query) {
    if (!lastInferenceResult || lastInferenceResult.query !== query) {
        document.getElementById('explanationResult').innerHTML = `
            <div class="explanation-box">
                <p>Por favor, primeiro execute uma consulta para '${query}' usando o motor de inferência. Depois volte aqui para ver os passos detalhados.</p>
            </div>
        `;
        return;
    }

    // Usa o inferenceTrace para exibir os passos
    document.getElementById('explanationResult').innerHTML = `
        <div class="explanation-box">
            <h3>Como cheguei na conclusão para '${query}'</h3>
            ${inferenceTrace.map(step => `<div>${step}</div>`).join('')}
        </div>
    `;
}

// ... (código anterior mantido)

// Função para salvar a base de conhecimento como JSON
function saveKnowledgeBase() {
    const dataStr = JSON.stringify(knowledgeBase, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'base_de_conhecimento.json';
    a.click();
    
    URL.revokeObjectURL(url);
}

// Função para carregar base de conhecimento a partir de arquivo JSON
function loadKnowledgeBase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.rules && data.facts && data.goals) {
                knowledgeBase = data;
                updateRulesList();
                updateFactsList();
                updateGoalsList();
                alert('Base de conhecimento carregada com sucesso!');
            } else {
                alert('Arquivo inválido. Certifique-se de que contém regras, fatos e objetivos.');
            }
        } catch (error) {
            alert('Erro ao ler o arquivo: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Gera a explicacao com base na escolha do usuario
function generateExplanation() {
    const type = document.getElementById('explanationType').value;
    const query = document.getElementById('explainInput').value.trim();

    if (!query) {
        alert('Por favor, insira um fato ou conclusão para explicar.');
        return;
    }

    if (type === 'why') {
        whyExplanation(query);
    } else if (type === 'how') {
        howExplanation(query);
    }
}

// Explicacao "Por que?" - Justifica a crença na conclusão
function whyExplanation(query) {
    let explanationHTML = `<h3>Explicando: Por que '${query}'?</h3>`;

    const directFact = knowledgeBase.facts.find(f => f.fact === query);
    if (directFact) {
        explanationHTML += `
            <div class="explanation-box">
                <p>Eu acredito em <strong>${query}</strong> porque este fato foi diretamente inserido na base de conhecimento.</p>
                <p>Fator de certeza: ${directFact.certainty}</p>
            </div>
        `;
        document.getElementById('explanationResult').innerHTML = explanationHTML;
        return;
    }

    const rulesThatSupport = knowledgeBase.rules.filter(r => r.conclusion === query);
    if (rulesThatSupport.length === 0) {
        explanationHTML += `
            <div class="explanation-box">
                <p>Eu <strong>não tenho informações suficientes</strong> para acreditar em '${query}'.</p>
                <p>Nem fatos diretos, nem regras que o provem foram encontrados.</p>
            </div>
        `;
        document.getElementById('explanationResult').innerHTML = explanationHTML;
        return;
    }

    let foundJustification = false;
    for (const rule of rulesThatSupport) {
        const conditions = rule.condition.split(' e ').map(c => c.trim());
        const satisfiedConditions = conditions.filter(cond => knowledgeBase.facts.find(f => f.fact === cond));

        if (satisfiedConditions.length === conditions.length) {
            foundJustification = true;
            explanationHTML += `
                <div class="explanation-box">
                    <p>Eu acredito em <strong>${query}</strong> porque:</p>
                    <ul>
                        ${satisfiedConditions.map(c => `<li>Fato conhecido: ${c}</li>`).join('')}
                    </ul>
                    <p>E pela regra:</p>
                    <p><strong>SE</strong> ${rule.condition} <strong>ENTÃO</strong> ${rule.conclusion}</p>
                    <p>Fator de certeza da regra: ${rule.certainty}</p>
                </div>
            `;
        }
    }

    if (!foundJustification) {
        explanationHTML += `
            <div class="explanation-box">
                <p>Existe(m) regra(s) que <strong>poderiam provar</strong> '${query}', mas não possuo todos os fatos necessários para aplicá-las.</p>
            </div>
        `;
    }

    document.getElementById('explanationResult').innerHTML = explanationHTML;
}

// Explicacao "Como?" - Mostra os passos usados na inferencia
function howExplanation(query) {
    if (!lastInferenceResult || lastInferenceResult.query !== query) {
        document.getElementById('explanationResult').innerHTML = `
            <div class="explanation-box">
                <p>Por favor, primeiro execute uma consulta para '${query}' usando o motor de inferência. Depois volte aqui para ver os passos detalhados.</p>
            </div>
        `;
        return;
    }

    document.getElementById('explanationResult').innerHTML = `
        <div class="explanation-box">
            <h3>Como cheguei na conclusão para '${query}'</h3>
            ${inferenceTrace.map(step => `<div>${step}</div>`).join('')}
        </div>
    `;
}


