import React from 'react';

const AppFooter = () => {
  return (
    <footer className="w-full mt-12 py-6 glass-effect">
      <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Boreal Labs. Todos los derechos reservados.
      </div>
    </footer>
  );
};

export default AppFooter;
