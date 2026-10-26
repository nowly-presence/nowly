import type { MockHandlers } from "@/preview/mock-router";

type MockPublication = {
  id: string;
  revision: number;
  published: boolean;
};

export const createPublicationMockHandlers = (): MockHandlers => {
  const publications = new Map<string, MockPublication>();
  const resultFor = (publication: MockPublication) => ({
    ok: true as const,
    url: `https://nowly.me/activities/${publication.id}`,
    revision: publication.revision,
    published: publication.published
  });
  return {
    START_CREATOR_CONNECT: () => ({ ok: true }),
    GET_OWN_ACTIVITY_PUBLICATION: ({ id }) => {
      const publication = publications.get(id);
      return publication ? resultFor(publication) : { ok: true, url: null };
    },
    PUBLISH_CUSTOM_ACTIVITY: ({ id, unpublish }) => {
      const previous = publications.get(id);
      const publication = {
        id: previous?.id ?? crypto.randomUUID().replaceAll("-", ""),
        revision: (previous?.revision ?? 0) + 1,
        published: !unpublish
      };
      publications.set(id, publication);
      return resultFor(publication);
    },
    GET_ACTIVITY_PUBLICATION_STATUS: () => ({
      ok: false,
      error: "PREVIEW_ONLY"
    }),
    APPLY_ACTIVITY_PUBLICATION: () => ({
      ok: false,
      error: "PREVIEW_ONLY"
    })
  };
};