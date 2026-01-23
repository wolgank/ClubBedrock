import BackButton from '@/shared/components/ui/BackButton'
import EmployeeNavBar from '@/shared/components/ui/EmployeeNavBar';

export default function HomeAdmin() {
  return (
    <div className="relative w-full max-w-[1343px] mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 text-center">
        <h1 className="text-3xl font-semibold text-gray-800 mb-4">
          Bienvenido, Administrador
        </h1>
        <p className="text-gray-600 text-lg">
          Aquí podrás gestionar el sistema.
        </p>
      </div>
    </div>
  );
}