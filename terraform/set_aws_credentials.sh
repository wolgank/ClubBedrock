#!/bin/bash

echo "🔐 Ingreso de credenciales temporales de AWS Academy"

echo -n "🟢 AWS Access Key ID: "
read aws_access_key

echo -n "🟢 AWS Secret Access Key: "
read aws_secret_key

echo -n "🟢 AWS Session Token: "
read aws_session_token

echo -n "🟢 Región (default: us-east-1): "
read aws_region

aws_region=${aws_region:-us-east-1}

echo ""
echo "✅ Exportando variables de entorno..."

export AWS_ACCESS_KEY_ID="$aws_access_key"
export AWS_SECRET_ACCESS_KEY="$aws_secret_key"
export AWS_SESSION_TOKEN="$aws_session_token"
export AWS_DEFAULT_REGION="$aws_region"

echo ""
echo "🧪 Verificando acceso con AWS CLI..."
aws sts get-caller-identity

if [ $? -eq 0 ]; then
  echo "🎉 Todo listo. Ya puedes usar Terraform."
else
  echo "❌ Error verificando credenciales. ¿Ingresaste todo correctamente?"
fi
