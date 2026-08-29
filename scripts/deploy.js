#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// (O nome da imagem será perguntado na primeira execução e salvo no package.json)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const packageJsonPath = path.join(process.cwd(), 'package.json');

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function runCommand(command) {
  console.log(`\n> Executando: ${command}`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
  } catch (error) {
    console.error(`\nErro ao executar comando: ${command}`);
    console.error('Processo abortado.');
    process.exit(1);
  }
}

async function main() {
  console.log('=== Sistema de Deploy (Git + Docker) ===\n');

  let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // 0. Configurar Imagem do Docker na primeira vez
  if (!packageJson.nectarDeploy || !packageJson.nectarDeploy.dockerImage) {
    console.log('⚠️ Configuração do Docker não encontrada para este projeto.');
    const username = (await askQuestion('Digite seu Username do Docker Hub (ex: 29172013): ')).trim();
    const projectName = (await askQuestion('Digite o nome do projeto/imagem (ex: hub-core): ')).trim();
    
    if (!packageJson.nectarDeploy) packageJson.nectarDeploy = {};
    packageJson.nectarDeploy.dockerImage = `${username}/${projectName}`;
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`\n✅ Configuração salva no package.json! Imagem configurada como: ${packageJson.nectarDeploy.dockerImage}\n`);
  }
  
  const DOCKER_IMAGE_NAME = packageJson.nectarDeploy.dockerImage;

  // 1. Perguntar o tipo de commit
  let typePrefix = '';
  while (!typePrefix) {
    const type = (await askQuestion('Foi uma correção (bugfix) ou alteração (feature)? [c/a]: ')).toLowerCase().trim();
    if (type === 'c' || type === 'correcao' || type === 'correção') {
      typePrefix = 'fix';
    } else if (type === 'a' || type === 'alteracao' || type === 'alteração') {
      typePrefix = 'feat';
    } else {
      console.log('Por favor, digite "c" para correção ou "a" para alteração.');
    }
  }

  // 2. Perguntar a descrição
  let description = '';
  while (!description) {
    description = (await askQuestion('Digite a descrição do commit: ')).trim();
  }

  const commitMessage = `${typePrefix}: ${description}`;
  console.log(`\nMensagem do commit será: "${commitMessage}"`);

  // 3. Atualizar a versão
  // (Lemos novamente caso algo tenha mudado, ou apenas usamos o carregado)
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version || '1.0.0';
  let [major, minor, patch] = currentVersion.split('.').map(Number);

  if (typePrefix === 'fix') {
    patch += 1;
  } else {
    minor += 1;
    patch = 0;
  }

  let newVersion = `${major}.${minor}.${patch}`;
  
  const confirmVersion = (await askQuestion(`\nA versão atual é ${currentVersion}. A nova versão será ${newVersion}. Confirmar? [S/n] ou digite a versão desejada (ex: 1.0.2): `)).toLowerCase().trim();
  if (confirmVersion === 'n' || confirmVersion === 'nao' || confirmVersion === 'não') {
    console.log('Processo cancelado pelo usuário.');
    process.exit(0);
  } else if (confirmVersion !== 's' && confirmVersion !== 'sim' && confirmVersion !== '') {
    // Se o usuário digitou uma versão manualmente (ex: "v1.0.2" ou "1.0.2")
    newVersion = confirmVersion.replace(/^v/, '');
  }

  // Salvar nova versão no package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`\nVersão atualizada para ${newVersion} no package.json`);

  rl.close();

  // 4. Executar os comandos
  runCommand('git status');
  runCommand('git add .');
  runCommand(`git commit -m "${commitMessage}"`);
  runCommand(`git tag -a v${newVersion} -m "Hub Core Nectar Corp ${newVersion}"`);
  
  // Pegar a branch atual para o push
  let currentBranch = 'main';
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', cwd: process.cwd() }).trim();
  } catch(e) {}

  runCommand(`git push origin ${currentBranch}`);
  runCommand(`git push origin v${newVersion}`);
  
  // 5. Verificar e realizar Login no Docker
  console.log('\n> Verificando autenticação do Docker...');
  try {
    const dockerInfo = execSync('docker info', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (!dockerInfo.includes('Username:')) {
      console.log('⚠️ Você não está logado no Docker. Solicitando credenciais...');
      execSync('docker login', { stdio: 'inherit' });
    } else {
      console.log('✅ Docker já está autenticado.');
    }
  } catch (error) {
    console.error('\n❌ Erro: Não foi possível conectar ao Docker. O Docker Desktop está rodando?');
    process.exit(1);
  }

  // 6. Build e Push do Docker
  runCommand(`docker build -t ${DOCKER_IMAGE_NAME}:${newVersion} .`);
  runCommand(`docker push ${DOCKER_IMAGE_NAME}:${newVersion}`);

  // Se desejar atualizar a tag latest também:
  // runCommand(`docker tag ${DOCKER_IMAGE_NAME}:${newVersion} ${DOCKER_IMAGE_NAME}:latest`);
  // runCommand(`docker push ${DOCKER_IMAGE_NAME}:latest`);

  console.log(`\n✅ Deploy da versão v${newVersion} concluído com sucesso!`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
