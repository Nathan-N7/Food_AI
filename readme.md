# Food AI — V2

A V1 deste projeto validava a ideia central: receber uma imagem de comida, analisar o conteúdo e gerar uma versão mais profissional para uso em delivery.

A V2 nasce da necessidade de transformar o protótipo em uma arquitetura mais próxima de um sistema real de engenharia de IA.

## Por que uma V2?

Durante os testes, ficou claro que o principal desafio não era apenas gerar uma boa imagem, mas criar um fluxo confiável, barato e controlável.

A V2 busca resolver três pontos principais:

1. **Segurança**
   - validar se o input realmente é uma imagem de comida;
   - evitar chamadas desnecessárias para modelos pagos;
   - reduzir risco de geração inconsistente.

2. **Custo**
   - reutilizar resultados intermediários;
   - evitar chamar Gemini/Flux quando a imagem não passa nos critérios;
   - permitir persistência de estado do pipeline.

3. **Consistência**
   - estruturar os dados com Pydantic;
   - organizar o fluxo com LangGraph;
   - permitir fallback, retry e validação humana quando necessário.
