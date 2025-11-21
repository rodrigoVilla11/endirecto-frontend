import Buttons from "./Buttons"

const Header = ({ headerBody }: any) => {
  return (
    <div className="h-auto mb-4 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 p-4 flex flex-col gap-4 mx-4 shadow-lg rounded-2xl border border-gray-100">
      {/* Sección de Botones */}
      <div className="flex flex-wrap justify-end items-center w-full border-b border-gradient-to-r from-pink-200 via-purple-200 to-blue-200 pb-4 gap-3">
        {headerBody.buttons.map((button: any, index: any) => (
          <Buttons 
            key={index} 
            logo={button.logo} 
            title={button.title} 
            onClick={button.onClick} 
            red={button.red} 
            disabled={button.disabled}
          />
        ))}
      </div>

      {/* Segunda Sección */}
      {headerBody.secondSection && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full border-b border-gray-200 pb-4 gap-3">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-700 text-sm">
              {headerBody.secondSection.title}
              <span className="font-bold pl-2 text-xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-blue-500">
                {headerBody.secondSection.amount}
              </span>
            </p>
          </div>
          {headerBody.secondSection.total && (
            <div className="font-medium text-gray-600 text-sm bg-white px-4 py-2 rounded-full shadow-sm">
              {headerBody.secondSection.total}
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap justify-start items-center w-full gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
        {headerBody.filters.map((filter: any, index: any) => (
          <div key={index} className="w-full sm:w-auto">
            {filter.content}
          </div>
        ))}
      </div>

      {/* Resultados */}
      <div className="w-full flex justify-end text-gray-600 text-sm font-medium">
        {headerBody.results}
      </div>
    </div>
  )
}

export default Header