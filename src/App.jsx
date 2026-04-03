import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_URL = "http://localhost:4000";

function App() {
  // Estados del usuario y del formulario.
  const [modo, setModo] = useState("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem("usuario_chat");
    return guardado ? JSON.parse(guardado) : null;
  });
  const [mensajeInfo, setMensajeInfo] = useState("");

  // Estados de salas y mensajes.
  const [salas, setSalas] = useState([]);
  const [salaActual, setSalaActual] = useState(null);
  const [nuevoNombreSala, setNuevoNombreSala] = useState("");
  const [tipoSala, setTipoSala] = useState("publica");
  const [passwordSala, setPasswordSala] = useState("");
  const [nombreSalaPrivada, setNombreSalaPrivada] = useState("");
  const [passwordSalaPrivada, setPasswordSalaPrivada] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");

  const socketRef = useRef(null);

  // Creo la conexion de sockets.
  useEffect(() => {
    socketRef.current = io(API_URL);

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // Este evento escucha mensajes nuevos de la sala actual.
  useEffect(() => {
    if (!socketRef.current) {
      return;
    }

    const manejarNuevoMensaje = (mensaje) => {
      setMensajes((mensajesAnteriores) => {
        if (mensaje.id_sala !== salaActual?.id) {
          return mensajesAnteriores;
        }

        return [...mensajesAnteriores, mensaje];
      });
    };

    socketRef.current.on("nuevo_mensaje", manejarNuevoMensaje);

    return () => {
      socketRef.current.off("nuevo_mensaje", manejarNuevoMensaje);
    };
  }, [salaActual]);

  // Guardo el usuario en localStorage para no perder la sesion.
  useEffect(() => {
    if (usuario) {
      localStorage.setItem("usuario_chat", JSON.stringify(usuario));
      cargarSalas(usuario.id);
    } else {
      localStorage.removeItem("usuario_chat");
    }
  }, [usuario]);

  async function manejarRegistro(evento) {
    evento.preventDefault();

    const respuesta = await fetch(`${API_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password }),
    });

    const data = await respuesta.json();
    setMensajeInfo(data.mensaje);

    if (respuesta.ok) {
      setUsuario(data.usuario);
      limpiarFormulario();
    }
  }

  async function manejarLogin(evento) {
    evento.preventDefault();

    const respuesta = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await respuesta.json();
    setMensajeInfo(data.mensaje);

    if (respuesta.ok) {
      setUsuario(data.usuario);
      limpiarFormulario();
    }
  }

  async function cargarSalas(idUsuario) {
    const respuesta = await fetch(`${API_URL}/api/salas?usuarioId=${idUsuario}`);
    const data = await respuesta.json();

    if (respuesta.ok) {
      setSalas(data);
    }
  }

  async function crearSala(evento) {
    evento.preventDefault();

    if (!nuevoNombreSala.trim()) {
      return;
    }

    const respuesta = await fetch(`${API_URL}/api/salas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: nuevoNombreSala,
        tipo: tipoSala,
        idUsuario: usuario.id,
        password: passwordSala,
      }),
    });

    const data = await respuesta.json();
    setMensajeInfo(data.mensaje);

    if (respuesta.ok) {
      setNuevoNombreSala("");
      setTipoSala("publica");
      setPasswordSala("");
      cargarSalas(usuario.id);
    }
  }

  async function entrarSalaPrivada(evento) {
    evento.preventDefault();

    const respuesta = await fetch(`${API_URL}/api/salas/unirse-privada`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idUsuario: usuario.id,
        nombreSala: nombreSalaPrivada,
        password: passwordSalaPrivada,
      }),
    });

    const data = await respuesta.json();
    setMensajeInfo(data.mensaje);

    if (respuesta.ok) {
      setNombreSalaPrivada("");
      setPasswordSalaPrivada("");
      await entrarSala(data.sala);
    }
  }

  async function entrarSala(sala) {
    const respuestaUnion = await fetch(`${API_URL}/api/salas/unirse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idUsuario: usuario.id,
        idSala: sala.id,
      }),
    });

    if (!respuestaUnion.ok) {
      const error = await respuestaUnion.json();
      setMensajeInfo(error.mensaje);
      return;
    }

    setSalaActual(sala);
    socketRef.current.emit("unirse_sala", sala.id);

    const respuestaMensajes = await fetch(
      `${API_URL}/api/salas/${sala.id}/mensajes?usuarioId=${usuario.id}`
    );
    const dataMensajes = await respuestaMensajes.json();

    if (respuestaMensajes.ok) {
      setMensajes(dataMensajes);
      cargarSalas(usuario.id);
    } else {
      setMensajeInfo(dataMensajes.mensaje);
    }
  }

  function enviarMensaje(evento) {
    evento.preventDefault();

    if (!nuevoMensaje.trim() || !salaActual) {
      return;
    }

    socketRef.current.emit("enviar_mensaje", {
      contenido: nuevoMensaje,
      idUsuario: usuario.id,
      idSala: salaActual.id,
    });

    setNuevoMensaje("");
  }

  function limpiarFormulario() {
    setNombre("");
    setEmail("");
    setPassword("");
  }

  function cerrarSesion() {
    setUsuario(null);
    setSalaActual(null);
    setMensajes([]);
    setSalas([]);
    setMensajeInfo("Sesion cerrada");
  }

  if (!usuario) {
    return (
      <div className="contenedor-principal">
        <div className="tarjeta">
          <h1>Chat Corporativo</h1>
          <p className="subtitulo">Si eres usuario nuevo porfavor registrate</p>

          <div className="cambio-modo">
            <button
              className={modo === "login" ? "activo" : ""}
              onClick={() => setModo("login")}
            >
              Login
            </button>
            <button
              className={modo === "registro" ? "activo" : ""}
              onClick={() => setModo("registro")}
            >
              Registro
            </button>
          </div>

          <form onSubmit={modo === "login" ? manejarLogin : manejarRegistro}>
            {modo === "registro" && (
              <input
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            )}

            <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">
              {modo === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>

          {mensajeInfo && <p className="mensaje-info">{mensajeInfo}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="contenedor-principal">
      <div className="app-chat">
        <aside className="panel panel-lateral">
          <h2>Mi perfil</h2>
          <p><strong>Nombre:</strong> {usuario.nombre}</p>
          <p><strong>Correo:</strong> {usuario.email}</p>
          <button className="boton-secundario" onClick={cerrarSesion}>
            Cerrar sesion
          </button>

          <hr />

          <h2>Crear sala</h2>
          <form onSubmit={crearSala}>
            <input
              type="text"
              placeholder="Nombre de la sala"
              value={nuevoNombreSala}
              onChange={(e) => setNuevoNombreSala(e.target.value)}
            />

            <select value={tipoSala} onChange={(e) => setTipoSala(e.target.value)}>
              <option value="publica">Publica</option>
              <option value="privada">Privada</option>
            </select>

            {tipoSala === "privada" && (
              <input
                type="password"
                placeholder="Contraseña de la sala"
                value={passwordSala}
                onChange={(e) => setPasswordSala(e.target.value)}
              />
            )}

            <button type="submit">Crear sala</button>
          </form>

          <hr />

          <h2>Entrar a privada</h2>
          <form onSubmit={entrarSalaPrivada}>
            <input
              type="text"
              placeholder="Nombre de la sala privada"
              value={nombreSalaPrivada}
              onChange={(e) => setNombreSalaPrivada(e.target.value)}
            />

            <input
              type="password"
              placeholder="Contraseña de la sala"
              value={passwordSalaPrivada}
              onChange={(e) => setPasswordSalaPrivada(e.target.value)}
            />

            <button type="submit">Entrar</button>
          </form>

          <hr />

          <h2>Salas</h2>
          <div className="lista-salas">
            {salas.map((sala) => (
              <button
                key={sala.id}
                className={salaActual?.id === sala.id ? "sala-activa" : ""}
                onClick={() => entrarSala(sala)}
              >
                {sala.nombre} ({sala.tipo})
              </button>
            ))}
          </div>
        </aside>

        <main className="panel panel-chat">
          <h2>{salaActual ? `Sala: ${salaActual.nombre}` : "Selecciona una sala"}</h2>

          {mensajeInfo && <p className="mensaje-info">{mensajeInfo}</p>}

          <div className="caja-mensajes">
            {mensajes.map((mensaje) => (
              <div
                key={mensaje.id}
                className={
                  mensaje.id_usuario === usuario.id ? "mensaje mio" : "mensaje"
                }
              >
                <p className="autor">
                  {mensaje.nombre} - {mensaje.email}
                </p>
                <p>{mensaje.contenido}</p>
                <small>{new Date(mensaje.fecha).toLocaleString()}</small>
              </div>
            ))}
          </div>

          {salaActual && (
            <form className="form-mensaje" onSubmit={enviarMensaje}>
              <input
                type="text"
                placeholder="Escribe un mensaje"
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
              />
              <button type="submit">Enviar</button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
