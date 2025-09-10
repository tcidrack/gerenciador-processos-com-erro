import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [aba, setAba] = useState("adicionar");
  const [processos, setProcessos] = useState([]);
  const [numero, setNumero] = useState("");
  const [usuario, setUsuario] = useState("");

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
      { numero, usuario, status: "Aguardando fechamento", data_envio: new Date() },
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

  const pendentes = processos.filter((p) => p.status === "Aguardando fechamento");
  const fechados = processos.filter((p) => p.status === "Fechado");

  // Agrupar fechados por usuário
  const agrupados = fechados.reduce((acc, p) => {
    if (!acc[p.usuario]) acc[p.usuario] = [];
    acc[p.usuario].push(p.numero);
    return acc;
  }, {});

  function copiarFechados() {
    let texto = "Processos Fechados ✅\n\n";
    Object.entries(agrupados).forEach(([usuario, nums]) => {
      texto += `${usuario}:\n${nums.join("\n")}\n\n`;
    });
    navigator.clipboard.writeText(texto);
    alert("Lista copiada!");
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard de Processos com Erro</h1>

      {/* Abas */}
      <div className="flex gap-4 mb-6">
        {["adicionar", "pendentes", "fechados"].map((tab) => (
          <button
            key={tab}
            onClick={() => setAba(tab)}
            className={`px-4 py-2 rounded-lg ${
              aba === tab ? "bg-red-500 text-white" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Aba Adicionar */}
      {aba === "adicionar" && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg">
          <h2 className="text-xl font-semibold mb-4">Adicionar processo</h2>
          <input
            className="w-full mb-2 p-2 rounded bg-gray-700"
            placeholder="Número"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
          <input
            className="w-full mb-2 p-2 rounded bg-gray-700"
            placeholder="Usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
          <button
            onClick={adicionarProcesso}
            className="bg-green-600 px-4 py-2 rounded hover:bg-green-500"
          >
            Adicionar
          </button>
        </div>
      )}

      {/* Aba Pendentes */}
      {aba === "pendentes" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Processos Pendentes</h2>
          {pendentes.length === 0 ? (
            <p>Nenhum processo pendente 🎉</p>
          ) : (
            <table className="table-auto w-full bg-gray-800 rounded-lg">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-4 py-2 text-left">Número</th>
                  <th className="px-4 py-2 text-left">Usuário</th>
                  <th className="px-4 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pendentes.map((p) => (
                  <tr key={p.id} className="border-t border-gray-600">
                    <td className="px-4 py-2">{p.numero}</td>
                    <td className="px-4 py-2">{p.usuario}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => fecharProcesso(p.id)}
                        className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-500"
                      >
                        Fechar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Aba Fechados */}
      {aba === "fechados" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Processos Fechados</h2>
          {fechados.length === 0 ? (
            <p>Nenhum processo fechado ainda.</p>
          ) : (
            <>
              <table className="table-auto w-full bg-gray-800 rounded-lg mb-4">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-4 py-2 text-left">Número</th>
                    <th className="px-4 py-2 text-left">Usuário</th>
                    <th className="px-4 py-2 text-left">Data Fechamento</th>
                  </tr>
                </thead>
                <tbody>
                  {fechados.map((p) => (
                    <tr key={p.id} className="border-t border-gray-600">
                      <td className="px-4 py-2">{p.numero}</td>
                      <td className="px-4 py-2">{p.usuario}</td>
                      <td className="px-4 py-2">
                        {p.data_fechado
                          ? new Date(p.data_fechado).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={copiarFechados}
                className="bg-yellow-600 px-4 py-2 rounded hover:bg-yellow-500"
              >
                📋 Copiar lista
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
