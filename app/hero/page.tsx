"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AdminShell from "@/components/AdminShell";

type HeroSlide = {
  id: string;
  brand_slug: string | null;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  mobile_image_url: string | null;
  button_text: string | null;
  button_href: string | null;
  active: boolean;
  sort_order: number;
};

type HeroForm = {
  brand_slug: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_href: string;
  active: boolean;
  sort_order: string;
};

const supabase = createClient();

const emptyForm: HeroForm = {
  brand_slug: "a-positive",
  title: "",
  subtitle: "",
  button_text: "SHOP NOW",
  button_href: "/",
  active: true,
  sort_order: "1",
};

export default function HeroPage() {
  const [slides, setSlides] =
    useState<HeroSlide[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editingSlide, setEditingSlide] =
    useState<HeroSlide | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState<HeroForm>(emptyForm);

  const [desktopFile, setDesktopFile] =
    useState<File | null>(null);

  const [mobileFile, setMobileFile] =
    useState<File | null>(null);

  const [desktopPreview, setDesktopPreview] =
    useState("");

  const [mobilePreview, setMobilePreview] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function loadSlides() {
    try {
      setError("");

      const {
        data,
        error: queryError,
      } =
        await supabase
          .from("hero_slides")
          .select(
            "id,brand_slug,title,subtitle,image_url,mobile_image_url,button_text,button_href,active,sort_order"
          )
          .order("sort_order", {
            ascending: true,
          })
          .order("created_at", {
            ascending: true,
          });

      if (queryError) {
        console.error(
          "HERO QUERY MESSAGE:",
          queryError.message
        );

        console.error(
          "HERO QUERY DETAILS:",
          queryError.details
        );

        console.error(
          "HERO QUERY HINT:",
          queryError.hint
        );

        console.error(
          "HERO QUERY CODE:",
          queryError.code
        );

        throw new Error(
          queryError.message
        );
      }

      setSlides(
        (data ?? []) as HeroSlide[]
      );
    } catch (err) {
      console.error(
        "HERO LOAD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load hero slides."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlides();
  }, []);

  function openAddForm() {
    setEditingSlide(null);
    setForm({
      ...emptyForm,
      sort_order: String(
        slides.length + 1
      ),
    });

    setDesktopFile(null);
    setMobileFile(null);
    setDesktopPreview("");
    setMobilePreview("");
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(
    slide: HeroSlide
  ) {
    setEditingSlide(slide);

    setForm({
      brand_slug:
        slide.brand_slug ??
        "a-positive",
      title:
        slide.title ?? "",
      subtitle:
        slide.subtitle ?? "",
      button_text:
        slide.button_text ??
        "SHOP NOW",
      button_href:
        slide.button_href ??
        "/",
      active:
        Boolean(slide.active),
      sort_order:
        String(
          slide.sort_order ??
            0
        ),
    });

    setDesktopFile(null);
    setMobileFile(null);

    setDesktopPreview(
      slide.image_url ?? ""
    );

    setMobilePreview(
      slide.mobile_image_url ?? ""
    );

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingSlide(null);
    setForm(emptyForm);
    setDesktopFile(null);
    setMobileFile(null);
    setDesktopPreview("");
    setMobilePreview("");
  }

  function handleDesktopChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setDesktopFile(file);

    setDesktopPreview(
      URL.createObjectURL(file)
    );
  }

  function handleMobileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setMobileFile(file);

    setMobilePreview(
      URL.createObjectURL(file)
    );
  }

  async function uploadImage(
    file: File,
    prefix: string
  ) {
    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const fileName =
      `heroes/${prefix}-${Date.now()}-${crypto
        .randomUUID()
        .replace(
          /-/g,
          ""
        )
        .slice(
          0,
          8
        )}.${extension}`;

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from("site-images")
        .upload(
          fileName,
          file,
          {
            cacheControl:
              "3600",
            upsert:
              false,
          }
        );

    if (uploadError) {
      throw new Error(
        uploadError.message
      );
    }

    const {
      data,
    } =
      supabase.storage
        .from("site-images")
        .getPublicUrl(
          fileName
        );

    return data.publicUrl;
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

    const cleanTitle =
      form.title.trim();

    if (!cleanTitle) {
      setError(
        "Hero title is required."
      );
      return;
    }

    const sortOrder =
      Number(form.sort_order);

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
      let desktopUrl =
        editingSlide?.image_url ??
        null;

      let mobileUrl =
        editingSlide?.mobile_image_url ??
        null;

      if (desktopFile) {
        desktopUrl =
          await uploadImage(
            desktopFile,
            "desktop"
          );
      }

      if (mobileFile) {
        mobileUrl =
          await uploadImage(
            mobileFile,
            "mobile"
          );
      }

      const payload = {
        brand_slug:
          form.brand_slug ||
          null,

        title:
          cleanTitle,

        subtitle:
          form.subtitle.trim() ||
          null,

        image_url:
          desktopUrl,

        mobile_image_url:
          mobileUrl,

        button_text:
          form.button_text.trim() ||
          null,

        button_href:
          form.button_href.trim() ||
          "/",

        active:
          form.active,

        sort_order:
          sortOrder,

        updated_at:
          new Date().toISOString(),
      };

      if (editingSlide) {
        const {
          error: updateError,
        } =
          await supabase
            .from("hero_slides")
            .update(payload)
            .eq(
              "id",
              editingSlide.id
            );

        if (updateError) {
          throw new Error(
            updateError.message
          );
        }

        setSuccess(
          "Hero slide updated successfully."
        );
      } else {
        const {
          error: insertError,
        } =
          await supabase
            .from("hero_slides")
            .insert(payload);

        if (insertError) {
          throw new Error(
            insertError.message
          );
        }

        setSuccess(
          "Hero slide added successfully."
        );
      }

      await loadSlides();

      window.setTimeout(
        () => {
          closeForm();
        },
        700
      );
    } catch (err) {
      console.error(
        "HERO SAVE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save hero slide."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteSlide(
    slide: HeroSlide
  ) {
    const confirmed =
      window.confirm(
        `Delete hero slide "${slide.title}"?`
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
          .from("hero_slides")
          .delete()
          .eq(
            "id",
            slide.id
          );

      if (deleteError) {
        throw new Error(
          deleteError.message
        );
      }

      setSlides(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              slide.id
          )
      );

      setSuccess(
        "Hero slide deleted successfully."
      );
    } catch (err) {
      console.error(
        "HERO DELETE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete hero slide."
      );
    }
  }

  return (
    <AdminShell>
      <main className="admin-page">

        <Link
          href="/"
          className="hero-back"
        >
          <ArrowLeft size={13} />
          DASHBOARD
        </Link>

        <div className="hero-heading">
          <div>
            <span className="admin-eyebrow">
              A-POSITIVE / HERO MANAGEMENT
            </span>

            <h1 className="admin-title">
              HERO
              <br />
              <em>CONTROL.</em>
            </h1>

            <p className="admin-subtitle">
              Manage the customer website hero
              slides, images, text, buttons and
              display order.
            </p>
          </div>

          <button
            type="button"
            className="admin-primary-button hero-add-button"
            onClick={openAddForm}
          >
            <Plus size={14} />
            ADD HERO
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
            <div className="hero-loading">
              LOADING HERO SLIDES...
            </div>
          </div>
        ) : (
          <div className="hero-list">

            {slides.map(
              (slide) => (
                <article
                  key={slide.id}
                  className="hero-card"
                >

                  <div className="hero-card-images">

                    <div className="hero-card-image">
                      {slide.image_url ? (
                        <img
                          src={
                            slide.image_url
                          }
                          alt={
                            slide.title
                          }
                        />
                      ) : (
                        <div className="hero-no-image">
                          <ImagePlus
                            size={25}
                          />
                          DESKTOP IMAGE
                        </div>
                      )}

                      <span>
                        DESKTOP
                      </span>
                    </div>

                    <div className="hero-card-image mobile">
                      {slide.mobile_image_url ? (
                        <img
                          src={
                            slide.mobile_image_url
                          }
                          alt={
                            slide.title
                          }
                        />
                      ) : (
                        <div className="hero-no-image">
                          <ImagePlus
                            size={21}
                          />
                          MOBILE
                        </div>
                      )}

                      <span>
                        MOBILE
                      </span>
                    </div>

                  </div>

                  <div className="hero-card-content">

                    <div className="hero-card-top">

                      <div>
                        <span className="hero-brand">
                          {slide.brand_slug ??
                            "ALL BRANDS"}
                        </span>

                        <h2>
                          {slide.title}
                        </h2>

                        {slide.subtitle && (
                          <p>
                            {
                              slide.subtitle
                            }
                          </p>
                        )}
                      </div>

                      <span
                        className={
                          slide.active
                            ? "hero-active"
                            : "hero-hidden"
                        }
                      >
                        {slide.active
                          ? "ACTIVE"
                          : "HIDDEN"}
                      </span>

                    </div>

                    <div className="hero-meta">

                      <div>
                        <span>
                          BUTTON
                        </span>

                        <strong>
                          {slide.button_text ??
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          LINK
                        </span>

                        <strong>
                          {slide.button_href ??
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          ORDER
                        </span>

                        <strong>
                          {
                            slide.sort_order
                          }
                        </strong>
                      </div>

                    </div>

                    <div className="hero-card-actions">

                      <button
                        type="button"
                        className="hero-edit-button"
                        onClick={() =>
                          openEditForm(
                            slide
                          )
                        }
                      >
                        <Save size={12} />
                        EDIT
                      </button>

                      <button
                        type="button"
                        className="hero-delete-button"
                        onClick={() =>
                          deleteSlide(
                            slide
                          )
                        }
                      >
                        <Trash2
                          size={12}
                        />
                        DELETE
                      </button>

                    </div>

                  </div>

                </article>
              )
            )}

            {slides.length === 0 && (
              <div className="admin-table-wrap">
                <div className="hero-empty">
                  NO HERO SLIDES YET.
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {showForm && (
        <div
          className="hero-modal-backdrop"
          onClick={closeForm}
        >
          <div
            className="hero-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="hero-modal-header">

              <div>
                <span>
                  A-POSITIVE / HERO
                </span>

                <h2>
                  {editingSlide
                    ? "EDIT HERO."
                    : "ADD HERO."}
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
              className="hero-form"
              onSubmit={handleSubmit}
            >

              {/* DESKTOP IMAGE */}

              <div className="hero-upload-section">

                <div
                  className="hero-upload-preview desktop-preview"
                >
                  {desktopPreview ? (
                    <img
                      src={
                        desktopPreview
                      }
                      alt="Desktop preview"
                    />
                  ) : (
                    <div className="hero-preview-placeholder">
                      <ImagePlus
                        size={24}
                      />
                      DESKTOP HERO
                    </div>
                  )}
                </div>

                <label className="hero-upload-button">
                  <Upload size={12} />
                  UPLOAD DESKTOP IMAGE

                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={
                      handleDesktopChange
                    }
                  />
                </label>

              </div>

              {/* MOBILE IMAGE */}

              <div className="hero-upload-section">

                <div
                  className="hero-upload-preview mobile-preview"
                >
                  {mobilePreview ? (
                    <img
                      src={
                        mobilePreview
                      }
                      alt="Mobile preview"
                    />
                  ) : (
                    <div className="hero-preview-placeholder">
                      <ImagePlus
                        size={22}
                      />
                      MOBILE HERO
                    </div>
                  )}
                </div>

                <label className="hero-upload-button">
                  <Upload size={12} />
                  UPLOAD MOBILE IMAGE

                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={
                      handleMobileChange
                    }
                  />
                </label>

              </div>

              {/* BRAND */}

              <label>
                <span>
                  BRAND
                </span>

                <select
                  value={
                    form.brand_slug
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      brand_slug:
                        event.target
                          .value,
                    })
                  }
                  disabled={saving}
                >
                  <option value="a-positive">
                    A-POSITIVE
                  </option>

                  <option value="blue-dream">
                    BLUE DREAM
                  </option>

                  <option value="shopping-zone-bd">
                    SHOPPING ZONE BD
                  </option>

                  <option value="">
                    ALL BRANDS
                  </option>
                </select>
              </label>

              {/* TITLE */}

              <label>
                <span>
                  HERO TITLE
                </span>

                <input
                  type="text"
                  value={
                    form.title
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title:
                        event.target
                          .value,
                    })
                  }
                  placeholder="OWN YOUR PRESENCE."
                  disabled={saving}
                />
              </label>

              {/* SUBTITLE */}

              <label>
                <span>
                  SUBTITLE
                </span>

                <textarea
                  rows={3}
                  value={
                    form.subtitle
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      subtitle:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Premium fashion made for your presence."
                  disabled={saving}
                />
              </label>

              <div className="hero-form-grid">

                {/* BUTTON TEXT */}

                <label>
                  <span>
                    BUTTON TEXT
                  </span>

                  <input
                    type="text"
                    value={
                      form.button_text
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        button_text:
                          event.target
                            .value,
                      })
                    }
                    placeholder="SHOP NOW"
                    disabled={saving}
                  />
                </label>

                {/* BUTTON LINK */}

                <label>
                  <span>
                    BUTTON LINK
                  </span>

                  <input
                    type="text"
                    value={
                      form.button_href
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        button_href:
                          event.target
                            .value,
                      })
                    }
                    placeholder="/brands/a-positive"
                    disabled={saving}
                  />
                </label>

              </div>

              <div className="hero-form-grid">

                {/* ORDER */}

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
                    onChange={(event) =>
                      setForm({
                        ...form,
                        sort_order:
                          event.target
                            .value,
                      })
                    }
                    disabled={saving}
                  />
                </label>

                {/* ACTIVE */}

                <label>
                  <span>
                    STATUS
                  </span>

                  <button
                    type="button"
                    className={
                      form.active
                        ? "hero-toggle active"
                        : "hero-toggle"
                    }
                    onClick={() =>
                      setForm({
                        ...form,
                        active:
                          !form.active,
                      })
                    }
                    disabled={saving}
                  >
                    {form.active
                      ? "ACTIVE"
                      : "HIDDEN"}
                  </button>
                </label>

              </div>

              {error && (
                <div className="hero-form-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="admin-primary-button hero-save-button"
                disabled={saving}
              >
                {saving
                  ? "SAVING..."
                  : editingSlide
                  ? "UPDATE HERO"
                  : "ADD HERO"}
              </button>

            </form>

          </div>
        </div>
      )}

      <style jsx>{`
        .hero-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #77736c;
          text-decoration: none;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.3px;
        }

        .hero-heading {
          margin-top: 34px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
        }

        .hero-add-button {
          width: auto;
          min-width: 145px;
          padding: 0 18px;
          flex-shrink: 0;
        }

        .hero-list {
          margin-top: 42px;
          display: grid;
          gap: 16px;
        }

        .hero-card {
          display: grid;
          grid-template-columns: 43% 57%;
          overflow: hidden;
          border: 1px solid #dedbd4;
          background: #fff;
        }

        .hero-card-images {
          min-width: 0;
          display: grid;
          grid-template-columns: 1fr 0.48fr;
          background: #ebe8e1;
        }

        .hero-card-image {
          position: relative;
          min-height: 330px;
          overflow: hidden;
        }

        .hero-card-image.mobile {
          border-left: 1px solid rgba(255,255,255,.5);
        }

        .hero-card-image img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .hero-card-image > span {
          position: absolute;
          left: 10px;
          bottom: 10px;
          padding: 5px 7px;
          background: rgba(17,17,15,.8);
          color: #fff;
          font-size: 5px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .hero-no-image {
          width: 100%;
          height: 100%;
          min-height: 330px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #99958e;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .hero-card-content {
          padding: 25px;
        }

        .hero-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .hero-brand {
          display: block;
          margin-bottom: 8px;
          color: #99958e;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .hero-card-top h2 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: 30px;
          line-height: 0.95;
          font-weight: 400;
          letter-spacing: -1px;
        }

        .hero-card-top p {
          max-width: 420px;
          margin: 12px 0 0;
          color: #77736c;
          font-size: 8px;
          line-height: 1.7;
        }

        .hero-active,
        .hero-hidden {
          flex-shrink: 0;
          padding: 6px 8px;
          font-size: 5px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .hero-active {
          background: #dfefe4;
          color: #286344;
        }

        .hero-hidden {
          background: #ece9e4;
          color: #777;
        }

        .hero-meta {
          margin-top: 30px;
          display: grid;
          grid-template-columns: 1fr 1.5fr .6fr;
          gap: 10px;
        }

        .hero-meta > div {
          min-height: 62px;
          padding: 11px;
          border: 1px solid #ece9e3;
          background: #faf9f7;
        }

        .hero-meta span {
          display: block;
          margin-bottom: 6px;
          color: #99958e;
          font-size: 5px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .hero-meta strong {
          display: block;
          overflow: hidden;
          color: #333;
          font-size: 8px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hero-card-actions {
          margin-top: 20px;
          display: flex;
          gap: 8px;
        }

        .hero-edit-button,
        .hero-delete-button {
          min-height: 38px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .hero-edit-button {
          border: 1px solid #111;
          background: #111;
          color: #fff;
        }

        .hero-delete-button {
          border: 1px solid #d7c2c2;
          background: #fff4f4;
          color: #963434;
        }

        .hero-loading,
        .hero-empty {
          min-height: 300px;
          display: grid;
          place-items: center;
          color: #99958e;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .hero-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 500;
          padding: 20px;
          display: grid;
          place-items: center;
          background: rgba(17,17,15,.48);
          backdrop-filter: blur(10px);
        }

        .hero-modal {
          width: min(720px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          padding: 28px;
          background: #f8f6f1;
          box-shadow: 0 35px 100px rgba(0,0,0,.28);
        }

        .hero-modal-header {
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .hero-modal-header > div > span {
          display: block;
          margin-bottom: 8px;
          color: #99958e;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.6px;
        }

        .hero-modal-header h2 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: 29px;
          font-weight: 400;
          letter-spacing: -1px;
        }

        .hero-modal-header > button {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid #d4d0c7;
          background: transparent;
        }

        .hero-form {
          display: grid;
          gap: 15px;
        }

        .hero-form label {
          display: block;
        }

        .hero-form label > span {
          display: block;
          margin-bottom: 7px;
          color: #85817a;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .hero-form input,
        .hero-form textarea,
        .hero-form select {
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #d2cec5;
          outline: 0;
          background: #fff;
          color: #111;
          font-size: 9px;
        }

        .hero-form select {
          min-height: 43px;
        }

        .hero-form textarea {
          resize: vertical;
          line-height: 1.6;
        }

        .hero-form input:focus,
        .hero-form textarea:focus,
        .hero-form select:focus {
          border-color: #111;
        }

        .hero-upload-section {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
        }

        .hero-upload-preview {
          width: 100%;
          height: 155px;
          overflow: hidden;
          background: #ebe8e1;
        }

        .hero-upload-preview.mobile-preview {
          height: 185px;
        }

        .hero-upload-preview img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .hero-preview-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #99958e;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.1px;
        }

        .hero-upload-button {
          min-height: 40px;
          padding: 0 13px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #111;
          background: #111;
          color: #fff;
          cursor: pointer;
          white-space: nowrap;
          font-size: 6px !important;
          letter-spacing: 1.1px !important;
        }

        .hero-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .hero-toggle {
          width: 100%;
          min-height: 43px;
          border: 1px solid #d2cec5;
          background: #fff;
          color: #777;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .hero-toggle.active {
          border-color: #286344;
          background: #dfefe4;
          color: #286344;
        }

        .hero-form-error {
          padding: 11px 12px;
          border: 1px solid #ead3d3;
          background: #f8eaea;
          color: #963434;
          font-size: 8px;
        }

        .hero-save-button {
          margin-top: 4px;
        }

        @media (max-width: 900px) {
          .hero-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .hero-add-button {
            width: 100%;
          }

          .hero-card {
            grid-template-columns: 1fr;
          }

          .hero-card-images {
            grid-template-columns: 1fr .55fr;
          }
        }

        @media (max-width: 600px) {
          .hero-card-images {
            grid-template-columns: 1fr;
          }

          .hero-card-image.mobile {
            display: none;
          }

          .hero-card-image {
            min-height: 250px;
          }

          .hero-no-image {
            min-height: 250px;
          }

          .hero-card-content {
            padding: 20px;
          }

          .hero-card-top {
            flex-direction: column;
          }

          .hero-meta,
          .hero-form-grid {
            grid-template-columns: 1fr;
          }

          .hero-upload-section {
            grid-template-columns: 1fr;
          }

          .hero-upload-button {
            width: 100%;
          }
        }
      `}</style>
    </AdminShell>
  );
}