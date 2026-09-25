"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  GripVertical,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AdminShell from "@/components/AdminShell";

type Announcement = {
  id: string;
  text: string;
  link_text: string | null;
  link_href: string | null;
  active: boolean;
  sort_order: number;
};

type FormData = {
  text: string;
  link_text: string;
  link_href: string;
  active: boolean;
  sort_order: string;
};

const supabase = createClient();

const emptyForm: FormData = {
  text: "",
  link_text: "",
  link_href: "",
  active: true,
  sort_order: "1",
};

export default function OffersPage() {
  const [offers, setOffers] =
    useState<Announcement[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingOffer, setEditingOffer] =
    useState<Announcement | null>(
      null
    );

  const [form, setForm] =
    useState<FormData>(
      emptyForm
    );

  async function loadOffers() {
    try {
      setError("");

      const {
        data,
        error: queryError,
      } =
        await supabase
          .from(
            "announcement_bars"
          )
          .select(
            "id,text,link_text,link_href,active,sort_order"
          )
          .order(
            "sort_order",
            {
              ascending: true,
            }
          );

      if (queryError) {
        console.error(
          "OFFERS QUERY MESSAGE:",
          queryError.message
        );

        console.error(
          "OFFERS QUERY DETAILS:",
          queryError.details
        );

        console.error(
          "OFFERS QUERY HINT:",
          queryError.hint
        );

        console.error(
          "OFFERS QUERY CODE:",
          queryError.code
        );

        throw new Error(
          queryError.message
        );
      }

      setOffers(
        (data ??
          []) as Announcement[]
      );
    } catch (err) {
      console.error(
        "OFFERS LOAD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load offers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOffers();
  }, []);

  function openAddForm() {
    setEditingOffer(null);

    setForm({
      ...emptyForm,
      sort_order: String(
        offers.length + 1
      ),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(
    offer: Announcement
  ) {
    setEditingOffer(offer);

    setForm({
      text: offer.text ?? "",
      link_text:
        offer.link_text ?? "",
      link_href:
        offer.link_href ?? "",
      active:
        Boolean(offer.active),
      sort_order:
        String(
          offer.sort_order ?? 0
        ),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingOffer(null);
    setForm(emptyForm);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess("");

    const text =
      form.text.trim();

    const linkText =
      form.link_text.trim();

    const linkHref =
      form.link_href.trim();

    const sortOrder =
      Number(
        form.sort_order
      );

    if (!text) {
      setError(
        "Offer text is required."
      );
      return;
    }

    if (
      !Number.isFinite(
        sortOrder
      )
    ) {
      setError(
        "Enter a valid sort order."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        text,
        link_text:
          linkText || null,
        link_href:
          linkHref || null,
        active:
          form.active,
        sort_order:
          sortOrder,
        updated_at:
          new Date().toISOString(),
      };

      if (editingOffer) {
        const {
          error: updateError,
        } =
          await supabase
            .from(
              "announcement_bars"
            )
            .update(payload)
            .eq(
              "id",
              editingOffer.id
            );

        if (updateError) {
          throw new Error(
            updateError.message
          );
        }

        setSuccess(
          "Offer updated successfully."
        );
      } else {
        const {
          error: insertError,
        } =
          await supabase
            .from(
              "announcement_bars"
            )
            .insert(payload);

        if (insertError) {
          throw new Error(
            insertError.message
          );
        }

        setSuccess(
          "Offer added successfully."
        );
      }

      await loadOffers();

      window.setTimeout(
        () => {
          closeForm();
        },
        700
      );
    } catch (err) {
      console.error(
        "OFFER SAVE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save offer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteOffer(
    offer: Announcement
  ) {
    const confirmed =
      window.confirm(
        `Delete "${offer.text}"?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const {
        error: deleteError,
      } =
        await supabase
          .from(
            "announcement_bars"
          )
          .delete()
          .eq(
            "id",
            offer.id
          );

      if (deleteError) {
        throw new Error(
          deleteError.message
        );
      }

      setOffers(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              offer.id
          )
      );

      setSuccess(
        "Offer deleted successfully."
      );
    } catch (err) {
      console.error(
        "OFFER DELETE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete offer."
      );
    }
  }

  async function toggleOffer(
    offer: Announcement
  ) {
    setError("");
    setSuccess("");

    try {
      const {
        error: updateError,
      } =
        await supabase
          .from(
            "announcement_bars"
          )
          .update({
            active:
              !offer.active,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            offer.id
          );

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      setOffers(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              offer.id
                ? {
                    ...item,
                    active:
                      !item.active,
                  }
                : item
          )
      );
    } catch (err) {
      console.error(
        "OFFER STATUS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to change offer status."
      );
    }
  }

  return (
    <AdminShell>
      <main className="admin-page">

        <Link
          href="/"
          className="offers-back"
        >
          <ArrowLeft size={13} />
          DASHBOARD
        </Link>

        <div className="offers-heading">

          <div>
            <span className="admin-eyebrow">
              A-POSITIVE / ANNOUNCEMENT MANAGEMENT
            </span>

            <h1 className="admin-title">
              OFFER
              <br />
              <em>TICKER.</em>
            </h1>

            <p className="admin-subtitle">
              Control the promotional announcement
              bar displayed below the customer
              website navbar.
            </p>
          </div>

          <button
            type="button"
            className="admin-primary-button offers-add-button"
            onClick={
              openAddForm
            }
          >
            <Plus size={14} />
            ADD OFFER
          </button>

        </div>

        {error && (
          <div
            className="admin-error"
            style={{
              marginTop: 25,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="admin-success"
            style={{
              marginTop: 25,
            }}
          >
            {success}
          </div>
        )}

        {loading ? (
          <div className="admin-table-wrap">
            <div className="offers-loading">
              LOADING OFFERS...
            </div>
          </div>
        ) : (
          <div className="offers-list">

            {offers.map(
              (offer) => (
                <article
                  key={offer.id}
                  className={
                    offer.active
                      ? "offer-card active"
                      : "offer-card"
                  }
                >

                  <div className="offer-drag">
                    <GripVertical
                      size={16}
                    />

                    <span>
                      {offer.sort_order}
                    </span>
                  </div>

                  <div className="offer-main">

                    <span className="offer-label">
                      ANNOUNCEMENT
                    </span>

                    <h2>
                      {offer.text}
                    </h2>

                    {(offer.link_text ||
                      offer.link_href) && (
                      <div className="offer-link-info">
                        {offer.link_text ||
                          "LINK"}
                        {" → "}
                        {offer.link_href ||
                          "/"}
                      </div>
                    )}

                  </div>

                  <div className="offer-status">
                    <button
                      type="button"
                      className={
                        offer.active
                          ? "offer-toggle active"
                          : "offer-toggle"
                      }
                      onClick={() =>
                        toggleOffer(
                          offer
                        )
                      }
                    >
                      {offer.active
                        ? "ACTIVE"
                        : "HIDDEN"}
                    </button>
                  </div>

                  <div className="offer-actions">

                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(
                          offer
                        )
                      }
                      title="Edit offer"
                    >
                      <Edit3
                        size={13}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteOffer(
                          offer
                        )
                      }
                      title="Delete offer"
                    >
                      <Trash2
                        size={13}
                      />
                    </button>

                  </div>

                </article>
              )
            )}

            {offers.length ===
              0 && (
              <div className="admin-table-wrap">
                <div className="offers-empty">
                  NO OFFERS YET.
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {showForm && (
        <div
          className="offer-modal-backdrop"
          onClick={closeForm}
        >
          <div
            className="offer-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="offer-modal-header">

              <div>
                <span>
                  A-POSITIVE / OFFER
                </span>

                <h2>
                  {editingOffer
                    ? "EDIT OFFER."
                    : "ADD OFFER."}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                <X size={17} />
              </button>

            </div>

            <form
              className="offer-form"
              onSubmit={
                handleSubmit
              }
            >

              <label>
                <span>
                  OFFER / ANNOUNCEMENT TEXT
                </span>

                <input
                  type="text"
                  value={
                    form.text
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,
                      text:
                        event.target
                          .value,
                    })
                  }
                  placeholder="NEW SEASON"
                  disabled={
                    saving
                  }
                />
              </label>

              <div className="offer-form-grid">

                <label>
                  <span>
                    LINK TEXT
                  </span>

                  <input
                    type="text"
                    value={
                      form.link_text
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        link_text:
                          event.target
                            .value,
                      })
                    }
                    placeholder="SHOP NOW"
                    disabled={
                      saving
                    }
                  />
                </label>

                <label>
                  <span>
                    LINK
                  </span>

                  <input
                    type="text"
                    value={
                      form.link_href
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        link_href:
                          event.target
                            .value,
                      })
                    }
                    placeholder="/brands/a-positive"
                    disabled={
                      saving
                    }
                  />
                </label>

              </div>

              <div className="offer-form-grid">

                <label>
                  <span>
                    DISPLAY ORDER
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.sort_order
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        sort_order:
                          event.target
                            .value,
                      })
                    }
                    disabled={
                      saving
                    }
                  />
                </label>

                <label>
                  <span>
                    STATUS
                  </span>

                  <button
                    type="button"
                    className={
                      form.active
                        ? "offer-form-toggle active"
                        : "offer-form-toggle"
                    }
                    onClick={() =>
                      setForm({
                        ...form,
                        active:
                          !form.active,
                      })
                    }
                    disabled={
                      saving
                    }
                  >
                    {form.active
                      ? "ACTIVE"
                      : "HIDDEN"}
                  </button>
                </label>

              </div>

              {error && (
                <div className="offer-form-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="admin-primary-button"
                disabled={
                  saving
                }
              >
                {saving
                  ? "SAVING..."
                  : editingOffer
                  ? "UPDATE OFFER"
                  : "ADD OFFER"}
              </button>

            </form>

          </div>
        </div>
      )}

      <style jsx>{`
        .offers-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #77736c;
          text-decoration: none;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.3px;
        }

        .offers-heading {
          margin-top: 34px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
        }

        .offers-add-button {
          width: auto;
          min-width: 140px;
          padding: 0 18px;
          flex-shrink: 0;
        }

        .offers-list {
          margin-top: 42px;
          display: grid;
          gap: 10px;
        }

        .offer-card {
          min-height: 96px;
          padding: 15px 18px;
          display: grid;
          grid-template-columns: 48px minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 16px;
          border: 1px solid #dedbd4;
          background: #fff;
        }

        .offer-card.active {
          border-left: 3px solid #b99a55;
        }

        .offer-drag {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #aaa69e;
        }

        .offer-drag span {
          font-size: 7px;
          font-weight: 900;
        }

        .offer-main {
          min-width: 0;
        }

        .offer-label {
          display: block;
          margin-bottom: 5px;
          color: #99958e;
          font-size: 5px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .offer-main h2 {
          margin: 0;
          overflow: hidden;
          color: #222;
          font-family: Georgia, serif;
          font-size: 18px;
          font-weight: 400;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .offer-link-info {
          margin-top: 6px;
          overflow: hidden;
          color: #99958e;
          font-family: monospace;
          font-size: 6px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .offer-toggle {
          min-height: 31px;
          padding: 0 10px;
          border: 1px solid #d5d1c9;
          background: #f4f2ed;
          color: #777;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .offer-toggle.active {
          border-color: #286344;
          background: #dfefe4;
          color: #286344;
        }

        .offer-actions {
          display: flex;
          gap: 7px;
        }

        .offer-actions button {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border: 1px solid #ddd9d0;
          background: #fff;
          color: #555;
        }

        .offer-actions button:first-child:hover {
          background: #111;
          color: #fff;
        }

        .offer-actions button:last-child:hover {
          background: #963434;
          border-color: #963434;
          color: #fff;
        }

        .offers-loading,
        .offers-empty {
          min-height: 280px;
          display: grid;
          place-items: center;
          color: #99958e;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .offer-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 500;
          padding: 20px;
          display: grid;
          place-items: center;
          background: rgba(17,17,15,.48);
          backdrop-filter: blur(10px);
        }

        .offer-modal {
          width: min(620px, 100%);
          padding: 28px;
          background: #f8f6f1;
          box-shadow: 0 35px 100px rgba(0,0,0,.28);
        }

        .offer-modal-header {
          margin-bottom: 25px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .offer-modal-header span {
          display: block;
          margin-bottom: 8px;
          color: #99958e;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.6px;
        }

        .offer-modal-header h2 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: 29px;
          font-weight: 400;
        }

        .offer-modal-header > button {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid #d4d0c7;
          background: transparent;
        }

        .offer-form {
          display: grid;
          gap: 15px;
        }

        .offer-form label {
          display: block;
        }

        .offer-form label > span {
          display: block;
          margin-bottom: 7px;
          color: #85817a;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .offer-form input {
          width: 100%;
          min-height: 43px;
          padding: 0 12px;
          border: 1px solid #d2cec5;
          outline: 0;
          background: #fff;
          color: #111;
          font-size: 9px;
        }

        .offer-form input:focus {
          border-color: #111;
        }

        .offer-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .offer-form-toggle {
          width: 100%;
          min-height: 43px;
          border: 1px solid #d2cec5;
          background: #fff;
          color: #777;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .offer-form-toggle.active {
          border-color: #286344;
          background: #dfefe4;
          color: #286344;
        }

        .offer-form-error {
          padding: 11px 12px;
          border: 1px solid #ead3d3;
          background: #f8eaea;
          color: #963434;
          font-size: 8px;
        }

        @media (max-width: 750px) {
          .offers-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .offers-add-button {
            width: 100%;
          }

          .offer-card {
            grid-template-columns: 32px minmax(0,1fr);
          }

          .offer-status,
          .offer-actions {
            grid-column: 2;
          }
        }

        @media (max-width: 520px) {
          .offer-form-grid {
            grid-template-columns: 1fr;
          }

          .offer-modal {
            padding: 20px;
          }
        }
      `}</style>
    </AdminShell>
  );
}