/** Regras de domínio, compartilhadas e verificadas novamente pelo servidor. */
export class MetaFinanceira {
  constructor(meta) {
    Object.assign(this, meta);
  }
  get percentual() {
    return Math.min(
      100,
      Math.round((this.guardado_centavos / this.alvo_centavos) * 100),
    );
  }
  get aporte_centavos() {
    if (!this.prazo_meses) return null;
    const inicio = new Date(
      (this.data_inicio || new Date().toISOString().slice(0, 10)) +
        "T12:00:00Z",
    );
    const agora = new Date();
    const decorridos = Math.max(
      0,
      (agora.getUTCFullYear() - inicio.getUTCFullYear()) * 12 +
        agora.getUTCMonth() -
        inicio.getUTCMonth(),
    );
    return Math.ceil(
      Math.max(0, this.alvo_centavos - this.guardado_centavos) /
        Math.max(1, this.prazo_meses - decorridos),
    );
  }
  toJSON() {
    return {
      ...this,
      percentual: this.percentual,
      aporte_centavos: this.aporte_centavos,
    };
  }
}
