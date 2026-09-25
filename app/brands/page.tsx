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

type Brand = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  image_url: string | null;
  accent_color: string | null;
  dark_color: string | null;
  active: boolean;
  sort_order: number;
};

const supabase = createClient();

/* =========================================================
   DEFAULT BRANDS
   These are the three official A-POSITIVE brands.
========================================================= */

const defaultBrands = [
  {
    slug: "blue-dream",
    name: "BLUE DREAM",
    tagline: "EVERYDAY. ELEVATED.",
    image_url:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=90",
    accent_color: "#d9e6f5",
    dark_color: "#071a38",
    active: true,
    sort_order: 1,
  },

  {
    slug: "shopping-zone-bd",
    name: "SHOPPING ZONE BD",
    tagline: "STYLE WITHOUT LIMITS.",
    image_url:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=90",
    accent_color: "#f4d9dc",
    dark_color: "#8e101d",
    active: true,
    sort_order: 2,
  },

  {
    slug: "a-positive",
    name: "A-POSITIVE",
    tagline: "OWN YOUR PRESENCE.",
    image_url:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=90",
    accent_color: "#e9e1ce",
    dark_color: "#11100e",
    active: true,
    sort_order: 3,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* =========================================================
   PAGE
========================================================= */

export default function BrandsPage() {
  const [brands, setBrands] =
    useState<Brand[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [savingId, setSavingId] =
    useState<string | null>(null);

  const [creating, setCreating] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [imageFiles, setImageFiles] =
    useState<Record<string, File | null>>(
      {}
    );

  const [previews, setPreviews] =
    useState<Record<string, string>>(
      {}
    );

  const [
    showCreateForm,
    setShowCreateForm,
  ] = useState(false);

  const [
    newBrand,
    setNewBrand,
  ] = useState({
    name: "",
    slug: "",
    tagline: "",
    image_url: "",
    accent_color: "#e9e1ce",
    dark_color: "#11100e",
    active: true,
    sort_order: 4,
  });

  /* =========================================================
     LOAD BRANDS
  ========================================================= */

  async function loadBrands() {
    try {
      setError("");

      const {
        data,
        error: queryError,
      } =
        await supabase
          .from("brands")
          .select(
            "id,slug,name,tagline,image_url,accent_color,dark_color,active,sort_order"
          )
          .order(
            "sort_order",
            {
              ascending: true,
            }
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

      if (queryError) {
        console.error(
          "BRANDS QUERY MESSAGE:",
          queryError.message
        );

        console.error(
          "BRANDS QUERY DETAILS:",
          queryError.details
        );

        console.error(
          "BRANDS QUERY HINT:",
          queryError.hint
        );

        console.error(
          "BRANDS QUERY CODE:",
          queryError.code
        );

        throw new Error(
          queryError.message
        );
      }

      setBrands(
        (data ?? []) as Brand[]
      );
    } catch (err) {
      console.error(
        "BRANDS LOAD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load brands."
      );
    }
  }

  /* =========================================================
     CREATE MISSING DEFAULT BRANDS
     
     This makes sure the three official brands
     exist in the database.
========================================================= */

  async function ensureDefaultBrands() {
    try {
      const {
        data,
        error: queryError,
      } =
        await supabase
          .from("brands")
          .select("slug");

      if (queryError) {
        throw new Error(
          queryError.message
        );
      }

      const existingSlugs =
        new Set(
          (data ?? []).map(
            (item) =>
              String(
                item.slug
              ).toLowerCase()
          )
        );

      const missing =
        defaultBrands.filter(
          (brand) =>
            !existingSlugs.has(
              brand.slug
            )
        );

      if (
        missing.length === 0
      ) {
        return;
      }

      const {
        error: insertError,
      } =
        await supabase
          .from("brands")
          .insert(
            missing.map(
              (brand) => ({
                slug:
                  brand.slug,

                name:
                  brand.name,

                tagline:
                  brand.tagline,

                image_url:
                  brand.image_url,

                accent_color:
                  brand.accent_color,

                dark_color:
                  brand.dark_color,

                active:
                  brand.active,

                sort_order:
                  brand.sort_order,

                updated_at:
                  new Date().toISOString(),
              })
            )
          );

      if (insertError) {
        throw new Error(
          insertError.message
        );
      }
    } catch (err) {
      console.error(
        "DEFAULT BRAND SYNC ERROR:",
        err
      );

      throw err;
    }
  }

  /* =========================================================
     INITIAL LOAD
========================================================= */

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError("");

        await ensureDefaultBrands();

        await loadBrands();
      } catch (err) {
        console.error(
          "BRANDS INITIALIZATION ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to initialize brands."
        );
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  /* =========================================================
     UPDATE BRAND
========================================================= */

  function updateBrand(
    id: string,
    field: keyof Brand,
    value:
      | string
      | boolean
      | number
  ) {
    setBrands(
      (current) =>
        current.map(
          (brand) =>
            brand.id === id
              ? {
                  ...brand,
                  [field]:
                    value,
                }
              : brand
        )
    );
  }

  /* =========================================================
     IMAGE SELECT
========================================================= */

  function handleImageChange(
    brandId: string,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setImageFiles(
      (current) => ({
        ...current,
        [brandId]:
          file,
      })
    );

    const previewUrl =
      URL.createObjectURL(file);

    setPreviews(
      (current) => ({
        ...current,
        [brandId]:
          previewUrl,
      })
    );
  }

  /* =========================================================
     UPLOAD BRAND IMAGE
========================================================= */

  async function uploadBrandImage(
    brand: {
      id?: string;
      slug: string;
    },
    file: File
  ) {
    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const uniqueId =
      crypto
        .randomUUID()
        .replace(
          /-/g,
          ""
        )
        .slice(
          0,
          10
        );

    const fileName =
      `brands/${brand.slug}-${Date.now()}-${uniqueId}.${extension}`;

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

  /* =========================================================
     SAVE EXISTING BRAND
========================================================= */

  async function saveBrand(
    brand: Brand
  ) {
    if (
      savingId ||
      !brand.name.trim()
    ) {
      return;
    }

    setSavingId(
      brand.id
    );

    setError("");
    setSuccess("");

    try {
      let imageUrl =
        brand.image_url;

      const selectedFile =
        imageFiles[brand.id];

      if (selectedFile) {
        imageUrl =
          await uploadBrandImage(
            brand,
            selectedFile
          );
      }

      const {
        error: updateError,
      } =
        await supabase
          .from("brands")
          .update({
            name:
              brand.name.trim(),

            tagline:
              brand.tagline?.trim() ||
              null,

            image_url:
              imageUrl,

            accent_color:
              brand.accent_color,

            dark_color:
              brand.dark_color,

            active:
              brand.active,

            sort_order:
              Number(
                brand.sort_order
              ) || 0,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            brand.id
          );

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      setBrands(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              brand.id
                ? {
                    ...item,
                    image_url:
                      imageUrl,
                  }
                : item
          )
      );

      setImageFiles(
        (current) => ({
          ...current,
          [brand.id]:
            null,
        })
      );

      setPreviews(
        (current) => {
          const copy = {
            ...current,
          };

          delete copy[
            brand.id
          ];

          return copy;
        }
      );

      setSuccess(
        `${brand.name} updated successfully.`
      );
    } catch (err) {
      console.error(
        "BRAND SAVE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save brand."
      );
    } finally {
      setSavingId(null);
    }
  }

  /* =========================================================
     CREATE BRAND
========================================================= */

  async function createBrand(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (creating) {
      return;
    }

    const name =
      newBrand.name.trim();

    if (!name) {
      setError(
        "Brand name is required."
      );

      return;
    }

    const slug =
      newBrand.slug.trim()
        ? slugify(
            newBrand.slug
          )
        : slugify(name);

    if (!slug) {
      setError(
        "A valid brand slug is required."
      );

      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      /* -----------------------------------------------------
         Duplicate slug check
      ----------------------------------------------------- */

      const {
        data: existingBrand,
        error: checkError,
      } =
        await supabase
          .from("brands")
          .select("id")
          .eq(
            "slug",
            slug
          )
          .maybeSingle();

      if (checkError) {
        throw new Error(
          checkError.message
        );
      }

      if (existingBrand) {
        throw new Error(
          `Brand slug "${slug}" already exists.`
        );
      }

      /* -----------------------------------------------------
         Image upload if selected
      ----------------------------------------------------- */

      let imageUrl =
        newBrand.image_url.trim() ||
        null;

      const createFile =
        imageFiles[
          "new-brand"
        ];

      if (createFile) {
        imageUrl =
          await uploadBrandImage(
            {
              slug,
            },
            createFile
          );
      }

      /* -----------------------------------------------------
         Insert
      ----------------------------------------------------- */

      const {
        data,
        error: insertError,
      } =
        await supabase
          .from("brands")
          .insert({
            slug,

            name,

            tagline:
              newBrand.tagline.trim() ||
              null,

            image_url:
              imageUrl,

            accent_color:
              newBrand.accent_color,

            dark_color:
              newBrand.dark_color,

            active:
              newBrand.active,

            sort_order:
              Number(
                newBrand.sort_order
              ) || 1,

            updated_at:
              new Date().toISOString(),
          })
          .select(
            "id,slug,name,tagline,image_url,accent_color,dark_color,active,sort_order"
          )
          .single();

      if (insertError) {
        throw new Error(
          insertError.message
        );
      }

      if (data) {
        setBrands(
          (current) =>
            [
              ...current,
              data as Brand,
            ].sort(
              (a, b) =>
                a.sort_order -
                b.sort_order
            )
        );
      }

      setNewBrand({
        name: "",
        slug: "",
        tagline: "",
        image_url: "",
        accent_color:
          "#e9e1ce",
        dark_color:
          "#11100e",
        active: true,
        sort_order:
          brands.length + 1,
      });

      setImageFiles(
        (current) => ({
          ...current,
          "new-brand":
            null,
        })
      );

      setPreviews(
        (current) => {
          const copy = {
            ...current,
          };

          delete copy[
            "new-brand"
          ];

          return copy;
        }
      );

      setShowCreateForm(
        false
      );

      setSuccess(
        `${name} created successfully.`
      );
    } catch (err) {
      console.error(
        "CREATE BRAND ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create brand."
      );
    } finally {
      setCreating(false);
    }
  }

  /* =========================================================
     NEW BRAND IMAGE
========================================================= */

  function handleNewBrandImage(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setImageFiles(
      (current) => ({
        ...current,
        "new-brand":
          file,
      })
    );

    const previewUrl =
      URL.createObjectURL(file);

    setPreviews(
      (current) => ({
        ...current,
        "new-brand":
          previewUrl,
      })
    );
  }

  /* =========================================================
     DELETE BRAND
     
     Optional, but useful for admin control.
========================================================= */

  async function deleteBrand(
    brand: Brand
  ) {
    if (deletingId) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${brand.name}?`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(
      brand.id
    );

    setError("");
    setSuccess("");

    try {
      const {
        error: deleteError,
      } =
        await supabase
          .from("brands")
          .delete()
          .eq(
            "id",
            brand.id
          );

      if (deleteError) {
        throw new Error(
          deleteError.message
        );
      }

      setBrands(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              brand.id
          )
      );

      setSuccess(
        `${brand.name} deleted successfully.`
      );
    } catch (err) {
      console.error(
        "DELETE BRAND ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete brand."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =========================================================
     LOADING
========================================================= */

  if (loading) {
    return (
      <AdminShell>
        <main className="admin-page">
          <div className="brands-loading">
            LOADING BRANDS...
          </div>
        </main>
      </AdminShell>
    );
  }

  /* =========================================================
     RETURN
========================================================= */

  return (
    <AdminShell>
      <main className="admin-page">

        <Link
          href="/"
          className="brands-back"
        >
          <ArrowLeft size={13} />
          DASHBOARD
        </Link>

        <div className="brands-heading">
          <span className="admin-eyebrow">
            A-POSITIVE / BRAND MANAGEMENT
          </span>

          <h1 className="admin-title">
            BRAND
            <br />
            <em>CONTROL.</em>
          </h1>

          <p className="admin-subtitle">
            Manage your brands, images,
            taglines, colors, visibility
            and display order from one place.
          </p>
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

        {/* =====================================================
            TOP ACTION
        ====================================================== */}

        <div className="brands-toolbar">
          <div>
            <span className="brand-count-label">
              TOTAL BRANDS
            </span>

            <strong>
              {brands.length}
            </strong>
          </div>

          <button
            type="button"
            className="add-brand-button"
            onClick={() =>
              setShowCreateForm(
                (current) =>
                  !current
              )
            }
          >
            {showCreateForm ? (
              <>
                <X size={13} />
                CLOSE
              </>
            ) : (
              <>
                <Plus size={13} />
                ADD NEW BRAND
              </>
            )}
          </button>
        </div>

        {/* =====================================================
            CREATE BRAND
        ====================================================== */}

        {showCreateForm && (
          <form
            className="brand-create-card"
            onSubmit={
              createBrand
            }
          >
            <div className="create-heading">
              <div>
                <span>
                  NEW BRAND
                </span>

                <h2>
                  Add a new
                  <br />
                  <em>identity.</em>
                </h2>
              </div>
            </div>

            <div className="create-grid">

              {/* IMAGE */}

              <div className="create-image-column">
                <div className="create-image-preview">

                  {previews[
                    "new-brand"
                  ] ||
                  newBrand.image_url ? (
                    <img
                      src={
                        previews[
                          "new-brand"
                        ] ||
                        newBrand.image_url
                      }
                      alt="New brand preview"
                    />
                  ) : (
                    <div className="brand-no-image">
                      <ImagePlus
                        size={30}
                      />
                      NO IMAGE
                    </div>
                  )}

                  <label className="brand-upload-button">
                    <Upload size={12} />
                    UPLOAD IMAGE

                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={
                        handleNewBrandImage
                      }
                    />
                  </label>
                </div>
              </div>

              {/* DETAILS */}

              <div className="create-fields">

                <label>
                  <span>
                    BRAND NAME
                  </span>

                  <input
                    value={
                      newBrand.name
                    }
                    onChange={(
                      event
                    ) =>
                      setNewBrand(
                        (
                          current
                        ) => ({
                          ...current,
                          name:
                            event
                              .target
                              .value,
                          slug:
                            current.slug ||
                            slugify(
                              event
                                .target
                                .value
                            ),
                        })
                      )
                    }
                    placeholder="Brand name"
                  />
                </label>

                <label>
                  <span>
                    SLUG
                  </span>

                  <input
                    value={
                      newBrand.slug
                    }
                    onChange={(
                      event
                    ) =>
                      setNewBrand(
                        (
                          current
                        ) => ({
                          ...current,
                          slug:
                            slugify(
                              event
                                .target
                                .value
                            ),
                        })
                      )
                    }
                    placeholder="brand-slug"
                  />
                </label>

                <label>
                  <span>
                    TAGLINE
                  </span>

                  <textarea
                    value={
                      newBrand.tagline
                    }
                    onChange={(
                      event
                    ) =>
                      setNewBrand(
                        (
                          current
                        ) => ({
                          ...current,
                          tagline:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    rows={2}
                    placeholder="EVERYDAY. ELEVATED."
                  />
                </label>

                <label>
                  <span>
                    IMAGE URL
                  </span>

                  <input
                    value={
                      newBrand.image_url
                    }
                    onChange={(
                      event
                    ) =>
                      setNewBrand(
                        (
                          current
                        ) => ({
                          ...current,
                          image_url:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="https://..."
                  />
                </label>

                <div className="brand-color-grid">

                  <label>
                    <span>
                      ACCENT
                    </span>

                    <input
                      type="text"
                      value={
                        newBrand.accent_color
                      }
                      onChange={(
                        event
                      ) =>
                        setNewBrand(
                          (
                            current
                          ) => ({
                            ...current,
                            accent_color:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      DARK
                    </span>

                    <input
                      type="text"
                      value={
                        newBrand.dark_color
                      }
                      onChange={(
                        event
                      ) =>
                        setNewBrand(
                          (
                            current
                          ) => ({
                            ...current,
                            dark_color:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    />
                  </label>

                </div>

                <label>
                  <span>
                    SORT ORDER
                  </span>

                  <input
                    type="number"
                    min={1}
                    value={
                      newBrand.sort_order
                    }
                    onChange={(
                      event
                    ) =>
                      setNewBrand(
                        (
                          current
                        ) => ({
                          ...current,
                          sort_order:
                            Number(
                              event
                                .target
                                .value
                            ),
                        })
                      )
                    }
                  />
                </label>

                <div className="create-actions">

                  <button
                    type="submit"
                    className="brand-save-button"
                    disabled={
                      creating
                    }
                  >
                    {creating ? (
                      "CREATING..."
                    ) : (
                      <>
                        <Save
                          size={13}
                        />
                        CREATE BRAND
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="cancel-create-button"
                    onClick={() =>
                      setShowCreateForm(
                        false
                      )
                    }
                  >
                    CANCEL
                  </button>

                </div>
              </div>
            </div>
          </form>
        )}

        {/* =====================================================
            BRAND GRID
        ====================================================== */}

        <div className="brands-grid">

          {brands.map(
            (brand) => (
              <section
                className="brand-admin-card"
                key={
                  brand.id
                }
              >

                {/* IMAGE */}

                <div className="brand-image-area">

                  {previews[
                    brand.id
                  ] ||
                  brand.image_url ? (
                    <img
                      src={
                        previews[
                          brand.id
                        ] ||
                        brand.image_url ||
                        ""
                      }
                      alt={
                        brand.name
                      }
                    />
                  ) : (
                    <div className="brand-no-image">
                      <ImagePlus
                        size={30}
                      />

                      NO IMAGE
                    </div>
                  )}

                  <label className="brand-upload-button">
                    <Upload size={12} />

                    CHANGE IMAGE

                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(
                        event
                      ) =>
                        handleImageChange(
                          brand.id,
                          event
                        )
                      }
                    />
                  </label>

                </div>

                {/* CONTENT */}

                <div className="brand-admin-content">

                  <div className="brand-top-line">

                    <span className="brand-slug">
                      {brand.slug}
                    </span>

                    <button
                      type="button"
                      className="brand-delete-button"
                      onClick={() =>
                        deleteBrand(
                          brand
                        )
                      }
                      disabled={
                        deletingId ===
                        brand.id
                      }
                    >
                      <Trash2
                        size={12}
                      />

                      {deletingId ===
                      brand.id
                        ? "DELETING"
                        : "DELETE"}
                    </button>

                  </div>

                  <input
                    className="brand-name-input"
                    value={
                      brand.name
                    }
                    onChange={(
                      event
                    ) =>
                      updateBrand(
                        brand.id,
                        "name",
                        event.target
                          .value
                      )
                    }
                  />

                  <textarea
                    value={
                      brand.tagline ??
                      ""
                    }
                    onChange={(
                      event
                    ) =>
                      updateBrand(
                        brand.id,
                        "tagline",
                        event.target
                          .value
                      )
                    }
                    placeholder="Brand tagline"
                    rows={2}
                  />

                  <div className="brand-color-grid">

                    <label>
                      <span>
                        ACCENT
                      </span>

                      <input
                        type="text"
                        value={
                          brand.accent_color ??
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateBrand(
                            brand.id,
                            "accent_color",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>
                        DARK
                      </span>

                      <input
                        type="text"
                        value={
                          brand.dark_color ??
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateBrand(
                            brand.id,
                            "dark_color",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                  </div>

                  <label className="brand-sort-row">
                    <span>
                      SORT ORDER
                    </span>

                    <input
                      type="number"
                      min={1}
                      value={
                        brand.sort_order
                      }
                      onChange={(
                        event
                      ) =>
                        updateBrand(
                          brand.id,
                          "sort_order",
                          Number(
                            event
                              .target
                              .value
                          )
                        )
                      }
                    />
                  </label>

                  <label className="brand-active-row">

                    <span>
                      SHOW ON WEBSITE
                    </span>

                    <button
                      type="button"
                      className={
                        brand.active
                          ? "brand-toggle active"
                          : "brand-toggle"
                      }
                      onClick={() =>
                        updateBrand(
                          brand.id,
                          "active",
                          !brand.active
                        )
                      }
                    >
                      {brand.active
                        ? "ACTIVE"
                        : "HIDDEN"}
                    </button>

                  </label>

                  <button
                    type="button"
                    className="brand-save-button"
                    disabled={
                      savingId ===
                      brand.id
                    }
                    onClick={() =>
                      saveBrand(
                        brand
                      )
                    }
                  >
                    {savingId ===
                    brand.id ? (
                      "SAVING..."
                    ) : (
                      <>
                        <Save
                          size={13}
                        />
                        SAVE BRAND
                      </>
                    )}
                  </button>

                </div>

              </section>
            )
          )}

        </div>

        {brands.length === 0 && (
          <div className="admin-table-wrap">
            <div className="brands-empty">
              NO BRANDS FOUND.
            </div>
          </div>
        )}

      </main>

      <style jsx>{`

        .brands-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #77736c;
          text-decoration: none;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.3px;
        }

        .brands-heading {
          margin-top: 34px;
        }

        .brands-toolbar {
          margin-top: 35px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 18px 20px;
          border: 1px solid #dedbd4;
          background: #fff;
        }

        .brands-toolbar > div {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .brand-count-label {
          color: #99958e;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .brands-toolbar strong {
          font-size: 18px;
          font-family: Georgia, serif;
          color: #111;
        }

        .add-brand-button {
          min-height: 38px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #111;
          background: #111;
          color: #fff;
          cursor: pointer;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .brand-create-card {
          margin-top: 20px;
          padding: 24px;
          border: 1px solid #dedbd4;
          background: #fff;
        }

        .create-heading {
          margin-bottom: 22px;
        }

        .create-heading span {
          color: #99958e;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .create-heading h2 {
          margin: 7px 0 0;
          color: #111;
          font-family: Georgia, serif;
          font-size: 28px;
          line-height: 0.95;
        }

        .create-heading em {
          color: #8f7441;
          font-style: normal;
        }

        .create-grid {
          display: grid;
          grid-template-columns: minmax(260px, 0.8fr) 1.2fr;
          gap: 22px;
        }

        .create-image-preview {
          position: relative;
          min-height: 360px;
          overflow: hidden;
          border: 1px solid #dedbd4;
          background: #ebe8e1;
        }

        .create-image-preview img {
          width: 100%;
          height: 100%;
          min-height: 360px;
          display: block;
          object-fit: cover;
        }

        .create-fields {
          display: grid;
          gap: 13px;
          align-content: start;
        }

        .create-fields label {
          display: block;
        }

        .create-fields label > span {
          display: block;
          margin-bottom: 6px;
          color: #99958e;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .create-fields input,
        .create-fields textarea {
          width: 100%;
          border: 1px solid #dedbd4;
          outline: none;
          background: #faf9f6;
          color: #111;
          padding: 11px;
          font-size: 8px;
        }

        .create-fields input {
          min-height: 38px;
        }

        .create-fields textarea {
          resize: vertical;
          line-height: 1.5;
        }

        .create-fields input:focus,
        .create-fields textarea:focus {
          border-color: #111;
        }

        .create-actions {
          display: grid;
          grid-template-columns: 1fr 130px;
          gap: 9px;
          margin-top: 5px;
        }

        .cancel-create-button {
          min-height: 42px;
          border: 1px solid #dedbd4;
          background: #f6f4ef;
          color: #555;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .brands-grid {
          margin-top: 42px;
          display: grid;
          grid-template-columns: repeat(
            3,
            minmax(0, 1fr)
          );
          gap: 16px;
        }

        .brand-admin-card {
          overflow: hidden;
          border: 1px solid #dedbd4;
          background: #fff;
        }

        .brand-image-area {
          position: relative;
          aspect-ratio: 1.15;
          overflow: hidden;
          background: #ebe8e1;
        }

        .brand-image-area > img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .brand-no-image {
          width: 100%;
          height: 100%;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #99958e;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .brand-upload-button {
          position: absolute;
          left: 12px;
          bottom: 12px;
          min-height: 34px;
          padding: 0 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid rgba(
            255,
            255,
            255,
            0.55
          );
          background: rgba(
            17,
            17,
            15,
            0.88
          );
          color: #fff;
          cursor: pointer;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.1px;
          backdrop-filter: blur(8px);
        }

        .brand-admin-content {
          padding: 20px;
        }

        .brand-top-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .brand-slug {
          display: block;
          margin-bottom: 7px;
          color: #99958e;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .brand-delete-button {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 0;
          background: transparent;
          color: #a33d3d;
          cursor: pointer;
          font-size: 5px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .brand-delete-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .brand-name-input {
          width: 100%;
          border: 0;
          border-bottom: 1px solid #dedbd4;
          outline: 0;
          padding: 3px 0 8px;
          background: transparent;
          color: #111;
          font-family: Georgia, serif;
          font-size: 22px;
        }

        .brand-admin-content textarea {
          width: 100%;
          margin-top: 15px;
          padding: 10px;
          border: 1px solid #dedbd4;
          outline: 0;
          resize: vertical;
          background: #faf9f6;
          color: #333;
          font-size: 8px;
          line-height: 1.6;
        }

        .brand-admin-content textarea:focus,
        .brand-name-input:focus {
          border-color: #111;
        }

        .brand-color-grid {
          margin-top: 13px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .brand-color-grid label {
          display: block;
        }

        .brand-color-grid span {
          display: block;
          margin-bottom: 5px;
          color: #99958e;
          font-size: 5px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .brand-color-grid input {
          width: 100%;
          min-height: 32px;
          padding: 0 8px;
          border: 1px solid #dedbd4;
          outline: 0;
          font-size: 7px;
        }

        .brand-sort-row {
          margin-top: 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .brand-sort-row span {
          color: #99958e;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .brand-sort-row input {
          width: 75px;
          min-height: 30px;
          padding: 0 8px;
          border: 1px solid #dedbd4;
          outline: 0;
          font-size: 7px;
        }

        .brand-active-row {
          margin-top: 14px;
          min-height: 37px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .brand-active-row > span {
          color: #99958e;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .brand-toggle {
          min-height: 30px;
          padding: 0 10px;
          border: 1px solid #d5d1c9;
          background: #f5f3ef;
          color: #777;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .brand-toggle.active {
          border-color: #286344;
          background: #dfefe4;
          color: #286344;
        }

        .brand-save-button {
          width: 100%;
          min-height: 42px;
          margin-top: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #111;
          background: #111;
          color: #fff;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.3px;
          cursor: pointer;
        }

        .brand-save-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .brands-loading,
        .brands-empty {
          min-height: 300px;
          display: grid;
          place-items: center;
          color: #99958e;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        @media (max-width: 1050px) {

          .brands-grid {
            grid-template-columns: 1fr;
          }

          .create-grid {
            grid-template-columns: 1fr;
          }

          .brand-admin-card {
            display: grid;
            grid-template-columns: minmax(
              250px,
              0.8fr
            ) 1fr;
          }

          .brand-image-area {
            aspect-ratio: auto;
            min-height: 360px;
          }

          .create-image-preview {
            min-height: 320px;
          }

          .create-image-preview img {
            min-height: 320px;
          }
        }

        @media (max-width: 650px) {

          .brands-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .brand-create-card {
            padding: 16px;
          }

          .brand-admin-card {
            display: block;
          }

          .brand-image-area {
            aspect-ratio: 1.15;
            min-height: 0;
          }

          .create-actions {
            grid-template-columns: 1fr;
          }
        }

      `}</style>
    </AdminShell>
  );
}