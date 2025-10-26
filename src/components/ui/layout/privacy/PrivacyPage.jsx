import React from 'react';
import { Helmet } from 'react-helmet-async';

const PrivacyPage = () => {
  return (
    <div className="w-full flex justify-center">
      <Helmet>
        <title>Política de Privacidad - Boreal Wallet</title>
      </Helmet>
      <div className="max-w-3xl w-full mx-auto p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-boreal-aqua to-boreal-blue">
              Política de Privacidad
            </span>
          </h1>
          <p className="text-gray-400 mt-1">Fecha de entrada en vigor: 25 de octubre de 2025</p>
        </header>

        <section className="glass-effect rounded-2xl border border-white/10 bg-[#0a1836]/90 backdrop-blur p-5 sm:p-7">
          <div className="max-w-none text-gray-300 leading-relaxed" style={{ textAlign: 'justify' }}>
            <p className="mb-4">
              Boreal Labs ("nosotros", "nuestro") opera la aplicación móvil Boreal Wallet (la "Aplicación").
              Esta página le informa sobre nuestras políticas con respecto a la recopilación, uso y divulgación de
              datos personales cuando utiliza nuestra Aplicación.
            </p>
            <p className="mb-4">
              Al utilizar la Aplicación, usted acepta la recopilación y el uso de información de acuerdo con esta política.
            </p>

            <h3 className="text-white text-xl font-semibold mt-6 mb-3">1. Información que Recopilamos</h3>
            <p className="mb-4">Recopilamos la información estrictamente necesaria para el funcionamiento de la Aplicación.</p>
            <p className="mb-2"><strong>Datos Proporcionados por el Usuario (Datos Personales):</strong></p>
            <ul className="list-disc ml-6 mb-4 space-y-2">
              <li>
                <strong>Dirección de Correo Electrónico:</strong> Requerimos su dirección de correo electrónico para la autenticación
                (inicio de sesión) y para usarla como identificador único para buscar y mostrarle los certificados que le pertenecen.
              </li>
              <li>
                <strong>Nombre de Usuario:</strong> Podemos obtener su nombre a través de su proveedor de inicio de sesión (como Google Sign-In)
                o de los datos asociados a sus certificados para personalizar su experiencia.
              </li>
              <li>
                <strong>Credenciales de Autenticación:</strong> Cuando utiliza el inicio de sesión con correo y contraseña, nuestro proveedor
                (Firebase Authentication) gestiona esta credencial de forma segura. Nosotros no tenemos acceso a su contraseña en texto plano.
              </li>
            </ul>

            <h3 className="text-white text-xl font-semibold mt-6 mb-3">2. Cómo Usamos su Información</h3>
            <p className="mb-2">Utilizamos los datos que recopilamos con los siguientes propósitos:</p>
            <ul className="list-disc ml-6 mb-4 space-y-2">
              <li>
                <strong>Para proveer y mantener la Aplicación:</strong> El uso principal de su correo electrónico es autenticar su identidad
                y permitirle acceder a su cuenta.
              </li>
              <li>
                <strong>Para mostrar sus certificados:</strong> Una vez autenticado, usamos su dirección de correo electrónico para realizar una consulta segura
                en nuestra base de datos (Firestore) y recuperar únicamente los certificados que están asociados a esa dirección.
              </li>
              <li>
                <strong>Para comunicarnos con usted:</strong> Ocasionalmente, podemos usar su correo electrónico para enviarle notificaciones importantes
                sobre su cuenta o cambios en el servicio (no utilizamos su correo para marketing).
              </li>
            </ul>

            <h3 className="text-white text-xl font-semibold mt-6 mb-3">3. Con Quién Compartimos su Información</h3>
            <p className="mb-4">
              <strong>No vendemos, alquilamos ni compartimos su información personal con terceros con fines de marketing.</strong>
            </p>
            <p className="mb-2">Solo compartimos información con los siguientes proveedores de servicios que son esenciales para el funcionamiento de la Aplicación:</p>
            <ul className="list-disc ml-6 mb-4 space-y-2">
              <li>
                <strong>Google Firebase:</strong> Boreal Wallet está construida sobre la plataforma Firebase de Google. Utilizamos sus servicios para:
                <ul className="list-disc ml-6 mt-2 space-y-2">
                  <li>
                    <strong>Firebase Authentication:</strong> Para gestionar de forma segura todo el proceso de inicio de sesión (Email/Contraseña y Google Sign-In).
                  </li>
                  <li>
                    <strong>Firestore (Base de Datos):</strong> Para almacenar de forma segura la información de los certificados y sus datos de usuario asociados (como su correo electrónico).
                  </li>
                </ul>
                Google actúa como nuestro procesador de datos y está obligado por sus propias políticas de privacidad a proteger su información.
              </li>
            </ul>

            <h3 className="text-white text-xl font-semibold mt-6 mb-3">4. Seguridad de los Datos</h3>
            <p className="mb-4">
              La seguridad de sus datos es importante para nosotros. Utilizamos medidas de seguridad estándar de la industria, incluyendo la transmisión de datos cifrados (HTTPS)
              y las reglas de seguridad de Firestore, para proteger su información contra el acceso, alteración o divulgación no autorizados.
            </p>

            <h3 className="text-white text-xl font-semibold mt-6 mb-3">5. Privacidad de los Niños</h3>
            <p className="mb-4">Nuestra Aplicación <strong>no está dirigida a ninguna persona menor de 13 años</strong> ("Niños").</p>
            <p className="mb-4">
              No recopilamos intencionadamente información de identificación personal de niños menores de 13 años. Si usted es padre o tutor y sabe que su hijo nos ha proporcionado datos personales,
              contáctenos. Si descubrimos que hemos recopilado datos personales de un niño menor de 13 años sin verificación del consentimiento de los padres, tomaremos medidas para eliminar esa información
              de nuestros servidores.
            </p>

            <h3 className="text-white text-xl font-semibold mt-6 mb-3">6. Retención y Eliminación de Datos</h3>
            <p className="mb-4">Retenemos su información personal mientras mantenga una cuenta activa en Boreal Wallet.</p>
            <p className="mb-4">
              Si desea eliminar su cuenta y todos sus datos personales asociados, puede solicitarlo en cualquier momento enviándonos un correo electrónico a
              <code className="text-boreal-aqua mx-1">contacto@borealabs.org</code>.
              Procesaremos su solicitud y eliminaremos sus datos de nuestros sistemas.
            </p>

            <h3 className="text-white text-xl font-semibold mt-6 mb-3">7. Cambios a esta Política de Privacidad</h3>
            <p className="mb-4">
              Podemos actualizar nuestra Política de Privacidad periódicamente. Le notificaremos cualquier cambio publicando la nueva Política de Privacidad en esta página.
              Se le aconseja revisar esta Política de Privacidad periódicamente para detectar cualquier cambio.
            </p>

            <h3 className="text-white text-xl font-semibold mt-6 mb-3">8. Contacto</h3>
            <p className="mb-2">
              Si tiene alguna pregunta sobre esta Política de Privacidad, por favor contáctenos en:
              <br />
              <code className="text-boreal-aqua">contacto@borealabs.org</code>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
