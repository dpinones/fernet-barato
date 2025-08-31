# Fernet Barato

Una aplicación web descentralizada para comparar precios de fernet en Argentina, construida con Next.js 15 y desplegada en la blockchain Starknet.

## 📱 Características

- **Comparación de Precios**: Encuentra los mejores precios de fernet en tu zona
- **Sistema de Agradecimientos**: Los usuarios pueden agradecer a las tiendas por mantener buenos precios
- **Panel de Administración**: Gestiona tiendas y actualiza precios
- **Integración Blockchain**: Autenticación y transacciones seguras vía Starknet

## 🚀 Demo en Vivo

La aplicación está disponible en: [Fernet Barato](https://fernet-barato.vercel.app)

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15 con React 19
- **Styling**: Tailwind CSS 4
- **Blockchain**: Starknet + Cairo smart contracts
- **Autenticación**: Cavos Service SDK
- **Deployment**: Vercel

## 🏗️ Estructura del Proyecto

```
/
├── app/
│   ├── api/v1/                    # API endpoints
│   │   ├── auth/                  # Autenticación
│   │   └── execute/               # Ejecución de transacciones
│   ├── page.tsx                   # Página principal
│   └── layout.tsx                 # Layout de la aplicación
├── components/                    # Componentes React
│   ├── AdminPanel.tsx            # Panel de administración
│   ├── LoginForm.tsx             # Formulario de login
│   └── ReportModal.tsx           # Modal de reportes
├── contracts/                     # Smart contracts Cairo
│   ├── src/lib.cairo             # Contrato principal FernetBarato
│   └── Scarb.toml                # Configuración Scarb
├── lib/                          # Utilidades y configuración
│   ├── contract.ts               # Integración con Starknet
│   ├── contract-config.ts        # ABI y configuración
│   ├── auth-atoms.ts             # Estados de autenticación
│   └── types.ts                  # Definiciones TypeScript
└── .env.local                    # Variables de entorno
```

## 🚀 Configuración Rápida

### 1. Clonar el repositorio

```bash
git clone https://github.com/dpinoness/fernet-barato.git
cd fernet-barato
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` con las siguientes variables:

```env
# Cavos Configuration
CAVOS_ORG_SECRET=your_org_secret
CAVOS_APP_ID=your_app_id
NEXT_PUBLIC_CAVOS_APP_ID=your_app_id

# Network Configuration
NEXT_PUBLIC_STARKNET_NETWORK=sepolia
```

**📖 Obtener credenciales**: Lee [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) para instrucciones detalladas.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🔗 Smart Contract

### Información del Contrato

- **Dirección**: `0x074be431870d9cc608ed79dd2d6dcf672a5da328ed89b25f4f698434a91638f8`
- **Red**: Starknet Mainnet
- **Lenguaje**: Cairo

### Funciones Principales

#### Funciones de Lectura (View)
- `get_all_stores()` - Obtiene todas las tiendas
- `get_current_price(store_id)` - Precio actual de una tienda
- `get_all_current_prices()` - Todos los precios actuales
- `get_reports(store_id)` - Reportes de una tienda
- `get_thanks_count(store_id)` - Contador de agradecimientos
- `has_user_thanked(store_id, user)` - Verifica si el usuario ya agradeció

#### Funciones de Escritura (External)
- `add_store()` - Agregar nueva tienda
- `update_price()` - Actualizar precio
- `give_thanks()` - Agradecer a una tienda
- `submit_report()` - Enviar reporte

### Estructura de Datos

```cairo
struct Store {
    id: felt252,
    name: ByteArray,
    address: ByteArray,
    phone: ByteArray,
    hours: ByteArray,
    URI: ByteArray
}

struct Price {
    price: u256,
    timestamp: u64      // Timestamp Unix
}

struct Report {
    store_id: felt252,
    description: ByteArray,
    submitted_at: u64,
    submitted_by: ContractAddress
}
```

## 🧪 Desarrollo de Smart Contracts

### Compilar contratos

```bash
scarb build
```

### Ejecutar tests

```bash
scarb test
# o
snforge test
```

## Recursos

Para problemas relacionados con:

- **Cavos SDK**: Consulta la [documentación de Cavos](https://docs.cavos.com)
- **Starknet**: Visita [Starknet Docs](https://docs.starknet.io)
- **Smart Contracts**: Revisa [Cairo Book](https://book.cairo-lang.org)
