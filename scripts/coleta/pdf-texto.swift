// Extrai o texto de um PDF com o PDFKit do macOS, sem instalar nada.
// Não roda no Linux (runner do GitHub).
//
// Uso:
//   swift scripts/coleta/pdf-texto.swift data-bruto/arquivo.pdf > saida.txt
import Foundation
import PDFKit

let argumentos = CommandLine.arguments
guard argumentos.count > 1 else {
    FileHandle.standardError.write("uso: swift pdf-texto.swift <arquivo.pdf>\n".data(using: .utf8)!)
    exit(2)
}
let caminho = argumentos[1]
guard let documento = PDFDocument(url: URL(fileURLWithPath: caminho)) else {
    FileHandle.standardError.write("nao consegui abrir \(caminho) como PDF\n".data(using: .utf8)!)
    exit(1)
}
guard let texto = documento.string, !texto.isEmpty else {
    FileHandle.standardError.write(
        "o PDF abriu mas nao tem camada de texto — provavelmente e imagem digitalizada\n".data(using: .utf8)!)
    exit(3)
}
print(texto)
