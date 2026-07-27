import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O bucket `avatars` aceita 2 MiB, mas o corpo de uma Server Action é
      // limitado a 1 MB por padrão — uma foto de 1,5 MB estourava com
      // "Body exceeded 1 MB limit" antes de chegar à nossa validação.
      // A folga acima de 2 MiB cobre o overhead de multipart (boundaries,
      // cabeçalhos de parte), conforme a documentação recomenda.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
