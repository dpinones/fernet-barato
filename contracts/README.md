### Declarar el contrato

```
sncast --account dojo_sepolia \
declare \
--url https://starknet-sepolia.public.blastapi.io/rpc/v0_8 \
--contract-name FernetBarato
```
### Deployar el contrato

```
sncast --account dojo_sepolia \
deploy \
--url https://starknet-sepolia.public.blastapi.io/rpc/v0_8 \
--class-hash 0x07c768f334734f58834719076b1baa39a323990e11fa02d26717fa940369dae9 \
--arguments "0x053c80dd051d0a515ba87dc8a3a32d56dc792e30d046ced89c6a537364e3435e"
```


# Mainnet

### Declarar el contrato

```
sncast --account dojo_mainnet_braavos \
declare \
--url https://starknet-mainnet.public.blastapi.io/rpc/v0_8 \
--contract-name FernetBarato
```
### Deployar el contrato

```
sncast --account dojo_mainnet_braavos \
deploy \
--url https://starknet-mainnet.public.blastapi.io/rpc/v0_8 \
--class-hash 0x01fd3309189725a35de14b2ba56a64d4868ba8d75e39779b1a210c74708577e0 \
--arguments "0x016337481939d86cd684e4bfacca4d37453c3a5ec69f19b77148d372b527e7be"
```
