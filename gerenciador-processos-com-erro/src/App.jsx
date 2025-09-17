import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [aba, setAba] = useState("adicionar");
  const [processos, setProcessos] = useState([]);
  const [numero, setNumero] = useState("");
  const [usuario, setUsuario] = useState("");
  const [mostrarBotaoLimpar, setMostrarBotaoLimpar] = useState(false);
  const [tema, setTema] = useState(localStorage.getItem("tema") || "claro");

  async function loadProcessos() {
    const { data, error } = await supabase.from("processos").select("*");
    if (!error) setProcessos(data);
  }

  useEffect(() => {
    loadProcessos();
  }, []);

  async function adicionarProcesso() {
    if (!numero || !usuario) return alert("Preencha os campos!");
    await supabase.from("processos").insert([
      {
        numero,
        usuario,
        status: "Aguardando fechamento",
        data_envio: new Date(),
      },
    ]);
    setNumero("");
    setUsuario("");
    loadProcessos();
  }

  async function fecharProcesso(id) {
    await supabase
      .from("processos")
      .update({ status: "Fechado", data_fechado: new Date() })
      .eq("id", id);
    loadProcessos();
  }

  async function excluirProcesso(id) {
    if (!confirm("Deseja realmente excluir este processo?")) return;
    await supabase.from("processos").delete().eq("id", id);
    loadProcessos();
  }

  async function fecharTodosPendentes() {
    if (!confirm("Tem certeza que deseja fechar TODOS os processos pendentes?"))
      return;

    await supabase
      .from("processos")
      .update({ status: "Fechado", data_fechado: new Date() })
      .eq("status", "Aguardando fechamento");

    loadProcessos();
  }

  async function limparFechados() {
    if (!confirm("Deseja realmente limpar todos os processos fechados?")) return;
    await supabase.from("processos").delete().eq("status", "Fechado");
    setMostrarBotaoLimpar(false);
    loadProcessos();
  }

  const pendentes = processos
    .filter((p) => p.status === "Aguardando fechamento")
    .slice()
    .reverse();

  const fechados = processos
    .filter((p) => p.status === "Fechado")
    .slice()
    .reverse();

  const agrupados = fechados.reduce((acc, p) => {
    const nomeFormatado = formatarNome(p.usuario); // sempre padroniza aqui
    if (!acc[nomeFormatado]) acc[nomeFormatado] = [];
    acc[nomeFormatado].push(p.numero);
    return acc;
  }, {});

  function copiarFechados() {
    let texto = "Processos Fechados ✅\n\n";
    Object.entries(agrupados).forEach(([usuario, nums]) => {
      texto += `${usuario}:\n${nums.join("\n")}\n\n`;
    });
    navigator.clipboard
      .writeText(texto)
      .then(() => {
        alert("Lista copiada!");
        setMostrarBotaoLimpar(true);
      })
      .catch(() => {
        alert("Não foi possível copiar para a área de transferência.");
      });
  }

  function copiarPendentesNumeros() {
    if (pendentes.length === 0) return alert("Nenhum processo pendente.");
    const texto = pendentes.map((p) => p.numero).join("\n");
    navigator.clipboard
      .writeText(texto)
      .then(() => alert("Números copiados!"))
      .catch(() => alert("Erro ao copiar números."));
  }

  function trocarTema() {
    const novoTema = tema === "claro" ? "escuro" : "claro";
    setTema(novoTema);
    localStorage.setItem("tema", novoTema);
  }

  const cores = {
    claro: {
      fundo: "#0070FF",
      card: "#E5F0FF",
      cardHeader: "#DDEBFF",
      textoTabela: "#000",
      btnCopiar: "#1E3A8A",
    },
    escuro: {
      fundo: "#111827",
      card: "#1E293B",
      cardHeader: "#334155",
      textoTabela: "#fff",
      btnCopiar: "#1640B8",
    },
  };

  function formatarData(dataStr) {
    if (!dataStr) return "-";
    const d = new Date(dataStr + "Z");
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    const horas = String(d.getHours()).padStart(2, "0");
    const minutos = String(d.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
  }

  function formatarNome(nome) {
    return nome
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(" ");
  }  

  function copiarFechados() {
    let texto = "Processos Fechados ✅\n\n";
    Object.entries(agrupados).forEach(([usuario, nums]) => {
      const nomeFormatado = formatarNome(usuario);
      texto += `${nomeFormatado}:\n${nums.join("\n")}\n\n`;
    });
    navigator.clipboard
      .writeText(texto)
      .then(() => {
        alert("Lista copiada!");
        setMostrarBotaoLimpar(true);
      })
      .catch(() => {
        alert("Não foi possível copiar para a área de transferência.");
      });
  }
  
  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: cores[tema].fundo }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img
            src="https://maida.health/wp-content/themes/melhortema/assets/images/logo-light.svg"
            alt="Logo"
            className="h-10"
          />
          <h1 className="text-3xl font-bold text-white">
            Dashboard de Processos com Erro ao Enviar Dados
          </h1>
        </div>

        <button
          onClick={trocarTema}
          className="px-4 py-2 rounded bg-gray-800 hover:brightness-110 text-white"
        >
          {tema === "claro" ? "🌙 Escuro" : "☀️ Claro"}
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-6 mb-6 border-b border-gray-600">
        {[
          { tab: "adicionar", label: "Adicionar" },
          { tab: "pendentes", label: `Pendentes (${pendentes.length})` },
          { tab: "fechados", label: `Fechados (${fechados.length})` },
        ].map(({ tab, label }) => (
          <button
            key={tab}
            onClick={() => setAba(tab)}
            className={`group relative pb-2 text-lg font-medium transition-colors ${
              aba === tab
                ? "text-[#FF0073]"
                : "text-[#fff] hover:text-[#FF0073]"
            }`}
          >
            {label}
            <span
              className={`absolute left-0 bottom-0 h-0.5 w-full origin-left transition-transform duration-300 ${
                aba === tab
                  ? "bg-[#FF0073] scale-x-100"
                  : "bg-[#FF0073] scale-x-0 group-hover:scale-x-100"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Aba Adicionar */}
      {aba === "adicionar" && (
        <div
          className="p-6 rounded-lg shadow-lg max-w-lg"
          style={{ backgroundColor: cores[tema].card }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: cores[tema].textoTabela }}
          >
            Adicionar processo
          </h2>
          <input
            className="w-full mb-3 p-3 rounded border border-gray-300"
            style={{
              backgroundColor: tema === "claro" ? "#fff" : "#334155",
              color: tema === "claro" ? "#000" : "#fff",
            }}
            placeholder="Usuário"
            value={usuario}
            onChange={(e) =>
              setUsuario(e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, ""))
            }
            onKeyDown={(e) => e.key === "Enter" && adicionarProcesso()} // ⬅️ aqui
          />

          <input
            className="w-full mb-3 p-3 rounded border border-gray-300"
            style={{
              backgroundColor: tema === "claro" ? "#fff" : "#334155",
              color: tema === "claro" ? "#000" : "#fff",
            }}
            placeholder="Número"
            value={numero}
            onChange={(e) => setNumero(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && adicionarProcesso()} // ⬅️ aqui
          />
          <button
            onClick={adicionarProcesso}
            className="bg-[#1F9D55] px-4 py-2 rounded hover:brightness-90 text-white"
          >
            Adicionar
          </button>
        </div>
      )}

      {/* Aba Pendentes */}
      {aba === "pendentes" && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">
            Processos Pendentes
          </h2>
          {pendentes.length === 0 ? (
            <p style={{ color: "#fff" }}>Nenhum processo pendente 🎉</p>
          ) : (
            <>
              <div className="mb-4 flex gap-3 justify-end">
                <button
                  onClick={copiarPendentesNumeros}
                  className="px-4 py-2 rounded hover:brightness-90 text-white"
                  style={{ backgroundColor: cores[tema].btnCopiar }}
                >
                  📋 Copiar Números
                </button>
                <button
                  onClick={fecharTodosPendentes}
                  className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 text-white"
                >
                  Fechar Todos
                </button>
              </div>

              <div className="overflow-x-auto mb-4">
                <table
                  className="table-auto w-full min-w-[400px] rounded-lg"
                  style={{ backgroundColor: cores[tema].card }}
                >
                  <thead style={{ backgroundColor: cores[tema].cardHeader }}>
                    <tr>
                      <th
                        className="px-4 py-2 text-left"
                        style={{ color: cores[tema].textoTabela }}
                      >
                        Número
                      </th>
                      <th
                        className="px-4 py-2 text-left"
                        style={{ color: cores[tema].textoTabela }}
                      >
                        Usuário
                      </th>
                      <th
                        className="px-4 py-2 text-center"
                        style={{ color: cores[tema].textoTabela }}
                      >
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendentes.map((p) => (
                      <tr key={p.id} className="border-t border-gray-300">
                        <td
                          className="px-4 py-2 text-left"
                          style={{ color: cores[tema].textoTabela }}
                        >
                          {p.numero}
                        </td>
                        <td
                          className="px-4 py-2 text-left"
                          style={{ color: cores[tema].textoTabela }}
                        >
                          {p.usuario}
                        </td>
                        <td className="px-4 py-2 text-center flex gap-2 justify-center">
                          <button
                            onClick={() => fecharProcesso(p.id)}
                            className="bg-[#0073FF] px-3 py-1 rounded hover:brightness-95 text-white"
                          >
                            Fechar
                          </button>
                          <button
                            onClick={() => excluirProcesso(p.id)}
                            className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 text-white"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Aba Fechados */}
      {aba === "fechados" && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">
            Processos Fechados
          </h2>
          {fechados.length === 0 ? (
            <p style={{ color: "#fff"}}>
              Nenhum processo fechado ainda.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto md:overflow-x-visible">
                <table
                  className="table-auto w-full rounded-lg"
                  style={{ backgroundColor: cores[tema].card }}
                >
                  <thead style={{ backgroundColor: cores[tema].cardHeader }}>
                    <tr>
                      <th
                        className="px-4 py-2 text-left break-words whitespace-normal"
                        style={{ color: cores[tema].textoTabela }}
                      >
                        Número
                      </th>
                      <th
                        className="px-4 py-2 text-left break-words whitespace-normal"
                        style={{ color: cores[tema].textoTabela }}
                      >
                        Usuário
                      </th>
                      <th
                        className="px-4 py-2 text-left break-words whitespace-normal"
                        style={{ color: cores[tema].textoTabela }}
                      >
                        Data Fechamento
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fechados.map((p) => (
                      <tr key={p.id} className="border-t border-gray-300">
                        <td
                          className="px-4 py-2 text-left break-words whitespace-normal"
                          style={{ color: cores[tema].textoTabela }}
                        >
                          {p.numero}
                        </td>
                        <td
                          className="px-4 py-2 text-left break-words whitespace-normal"
                          style={{ color: cores[tema].textoTabela }}
                        >
                          {p.usuario}
                        </td>
                        <td
                          className="px-4 py-2 text-left break-words whitespace-normal"
                          style={{ color: cores[tema].textoTabela }}
                        >
                          {formatarData(p.data_fechado)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={copiarFechados}
                  className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 text-white"
                >
                  📋 Copiar Lista
                </button>

                {mostrarBotaoLimpar && (
                  <button
                    onClick={limparFechados}
                    className="bg-[#FF0073] px-4 py-2 rounded hover:brightness-95 text-white"
                  >
                    🗑️ Limpar Fechados
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
