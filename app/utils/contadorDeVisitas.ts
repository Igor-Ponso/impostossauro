/**
 * URLs públicas geradas uma vez pela API de Markdown do GitHub.
 * O Komarev só incrementa requisições vindas do Camo. Os dois idiomas usam
 * o identificador igor-ponso-impostossauro, separado do perfil e dos testes.
 * Não trocar por uma URL direta do Komarev nem consultar a imagem no build.
 */
export const contadorDeVisitasCamo = {
  'pt-BR': 'https://camo.githubusercontent.com/e7fdbae10a4b18b218bede50939efb26a6d9fd6131b2bc97c995471ac5e39a8b/68747470733a2f2f6b6f6d617265762e636f6d2f67687076632f3f757365726e616d653d69676f722d706f6e736f2d696d706f73746f73736175726f266c6162656c3d41636573736f7326636f6c6f723d306537356236267374796c653d666c61742d737175617265',
  en: 'https://camo.githubusercontent.com/aafbf55d953e4329ea7b916a58e4760f4e9407af8aa4420b8b3b535c86e266c1/68747470733a2f2f6b6f6d617265762e636f6d2f67687076632f3f757365726e616d653d69676f722d706f6e736f2d696d706f73746f73736175726f266c6162656c3d506167652b766965777326636f6c6f723d306537356236267374796c653d666c61742d737175617265',
} as const;
