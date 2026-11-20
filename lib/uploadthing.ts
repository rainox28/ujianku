// lib/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // Upload materi untuk referensi AI
  materiUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      {
        maxFileSize: "16MB",
        maxFileCount: 1,
      },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError("Silakan login terlebih dahulu");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
