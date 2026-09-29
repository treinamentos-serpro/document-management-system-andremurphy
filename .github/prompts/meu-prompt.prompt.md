---
description: Validação para rejeitar uploads sem arquivos
name: validar-arquivo
argument-hint: caminho do modulo (ex. backend/src/services/documents.service.js)
agent: agent
---

# Validar uploads sem arquivos

Este prompt valida se o módulo especificado rejeita uploads sem arquivos, lançando um erro apropriado.

Requisitos:

- O módulo deve lançar um erro quando um upload sem arquivo for tentado.
- O erro deve ter uma mensagem clara indicando que o arquivo é obrigatório.
- O erro deve ter um código de status 400.
