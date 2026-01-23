import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Issue = {
  path: (string | number)[];
  message: string;
};

export type InvalidUser = {
  user: {
    name?: string;
    lastname?: string;
    documentID?: string;
    [key: string]: any; // soporte extendido
  };
  errors: Issue[];
};

type ErrorWithInvalidUsers = {
  message?: string;
  invalidUsers?: InvalidUser[];
};

export function ErrorAlert({
  error,
  onFix,
}: {
  error?: ErrorWithInvalidUsers;
  onFix?: (user: InvalidUser["user"]) => void;
}) {
  if (!error) return null;

  const hasGroupedErrors = error.invalidUsers && error.invalidUsers.length > 0;

  return (
    <Alert variant="destructive" className="max-w-3xl mx-auto my-6">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-base font-semibold">
        {error.message ?? "Error de validación"}
      </AlertTitle>
      <AlertDescription className="mt-2 text-sm text-red-700">
        {hasGroupedErrors ? (
          <ul className="space-y-6">
            {error.invalidUsers!.map((item, index) => {
              const { user, errors } = item;
              return (
                <li key={index} className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">
                      {user.lastname} {user.name} ({user.documentID ?? "Sin documento"})
                    </div>
                    {onFix && (
                      <Button
                        variant="outline"
                        className="text-sm"
                        onClick={() => onFix(user)}
                      >
                        Corregir
                      </Button>
                    )}
                  </div>
                  <ul className="list-disc pl-5 text-red-700 mt-1 space-y-1">
                    {errors.map((err, i) => (
                      <li key={i}>{err.message}</li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>{error.message}</p>
        )}
      </AlertDescription>
    </Alert>
  );
}
