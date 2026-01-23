import { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
//import { TanStackRouterDevtools } from '@tanstack/router-devtools'
interface MyRouterContext {
  queryClient: QueryClient;
}
export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: Root,
});
function NavBar() {
    //FALTA ARREGLAR ESTO ESTÁ FORKEADO DE MI PROYECTO PERSONAL DE ACÁ DEBERÍAN CARGAR LAS RUTAS
  return (
    <div className="p-2 flex justify-between  max-w-2xl m-auto items-baseline">
      <Link to="/" className="[&.active]:font-bold mr-auto pr-8 bg-white">
        <h1 className="text-2xl fond-bold ">Expense Tracker</h1>
      </Link>
      <div className=" flex gap-2">
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
        <Link to="/expenses" className="[&.active]:font-bold">
          Expenses
        </Link>
        <Link to="/create-expense" className="[&.active]:font-bold">
          Create-expense
        </Link>
        <Link to="/profile" className="[&.active]:font-bold">
          Profile
        </Link>
      </div>
    </div>
  );
}
function Root() {
  return (
    <>
      <NavBar />
      <hr />
      <div className="p-2 flex gap-2 max-w-2xl m-auto">
        <Outlet />
      </div>
      <Toaster />
      {/*<TanStackRouterDevtools />*/}
    </>
  );
}
