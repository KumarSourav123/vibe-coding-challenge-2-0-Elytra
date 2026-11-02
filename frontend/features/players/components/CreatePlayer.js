"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import { createPlayer } from "../api/playersApi";
import CredentialsCard from "./CredentialsCard";
import PlayerForm from "./PlayerForm";

/** Add-player screen: form, then the login details to hand to the player. */
export default function CreatePlayer() {
  const router = useRouter();
  const [created, setCreated] = useState(null);
  const [formKey, setFormKey] = useState(0);

  async function handleSubmit(payload) {
    const result = await createPlayer(payload);
    if (result.ok) setCreated({ player: result.data.player, password: payload.temporaryPassword });
    return result;
  }

  if (created) {
    const { player, password } = created;
    return (
      <div className="space-y-5">
        <CredentialsCard name={player.name} email={player.account.email} password={password} />
        <div className="flex flex-wrap gap-3">
          <Button href={`/coach/players/${player.id}`} iconRight="arrowRight">
            View player
          </Button>
          <Button
            variant="secondary"
            icon="plus"
            onClick={() => {
              setCreated(null);
              setFormKey((key) => key + 1);
            }}
          >
            Add another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card padding={false}>
      <PlayerForm
        key={formKey}
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/coach/players")}
        submitLabel="Create player"
      />
    </Card>
  );
}
