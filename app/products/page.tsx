"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  ImagePlus,
  Package,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AdminShell from "@/components/AdminShell";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  old_price: number | null;
  image_url: string | null;
  stock: number | null;
  featured: boolean | null;
  created_at: string | null;
};

type ProductForm = {
  name: string;
  brand: string;
  category: string;
  price: string;
  old_price: string;
  stock: string;
  featured: boolean;
};

const supabase = createClient();

const emptyForm: ProductForm = {
  name: "",
  brand: "A-POSITIVE",
  category: "FASHION",
  price: "",
  old_price: "",
  stock: "0",
  featured: false,
};

function formatPrice(
  value: number | null | undefined
) {
  return `৳${(
    Number(value) || 0
  ).toLocaleString("en-BD")}`;
}

export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] =
    useState<ProductForm>(emptyForm);

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState("");

  async function loadProducts() {
    try {
      setError("");

      const {
        data,
        error: queryError,
      } =
        await supabase
          .from("products")
          .select(
            "id,name,brand,category,price,old_price,image_url,stock,featured,created_at"
          )
          .order("created_at", {
            ascending: false,
          });

      if (queryError) {
        throw new Error(
          queryError.message
        );
      }

      setProducts(
        (data ?? []) as Product[]
      );
    } catch (err) {
      console.error(
        "PRODUCT LOAD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openAddForm() {
    setEditingProduct(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(
    product: Product
  ) {
    setEditingProduct(product);

    setForm({
      name: product.name ?? "",
      brand:
        product.brand ??
        "A-POSITIVE",
      category:
        product.category ??
        "FASHION",
      price:
        product.price !== null
          ? String(product.price)
          : "",
      old_price:
        product.old_price !== null &&
        product.old_price !== undefined
          ? String(
              product.old_price
            )
          : "",
      stock:
        product.stock !== null
          ? String(product.stock)
          : "0",
      featured:
        Boolean(product.featured),
    });

    setImageFile(null);
    setImagePreview(
      product.image_url ?? ""
    );
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setImageFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(
      previewUrl
    );
  }

  async function uploadImage(
    file: File
  ) {
    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const fileName =
      `products/${Date.now()}-${crypto
        .randomUUID()
        .replace(/-/g, "")
        .slice(0, 10)}.${extension}`;

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from("site-images")
        .upload(
          fileName,
          file,
          {
            cacheControl: "3600",
            upsert: false,
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

    const cleanName =
      form.name.trim();

    const cleanBrand =
      form.brand.trim();

    const cleanCategory =
      form.category.trim();

    const price =
      Number(form.price);

    const oldPrice =
      form.old_price.trim()
        ? Number(
            form.old_price
          )
        : null;

    const stock =
      Math.max(
        0,
        Number(form.stock)
      );

    if (!cleanName) {
      setError(
        "Product name is required."
      );
      return;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError(
        "Enter a valid product price."
      );
      return;
    }

    if (
      oldPrice !== null &&
      (!Number.isFinite(
        oldPrice
      ) || oldPrice < 0)
    ) {
      setError(
        "Enter a valid old price."
      );
      return;
    }

    if (!Number.isFinite(stock)) {
      setError(
        "Enter a valid stock number."
      );
      return;
    }

    setSaving(true);

    try {
      let imageUrl =
        editingProduct?.image_url ??
        null;

      if (imageFile) {
        imageUrl =
          await uploadImage(
            imageFile
          );
      }

      const productPayload = {
        name: cleanName,
        brand:
          cleanBrand ||
          "A-POSITIVE",
        category:
          cleanCategory ||
          "FASHION",
        price,
        old_price: oldPrice,
        stock,
        featured:
          form.featured,
        image_url:
          imageUrl,
      };

      if (editingProduct) {
        const {
          error: updateError,
        } =
          await supabase
            .from("products")
            .update(
              productPayload
            )
            .eq(
              "id",
              editingProduct.id
            );

        if (updateError) {
          throw new Error(
            updateError.message
          );
        }

        setSuccess(
          "Product updated successfully."
        );
      } else {
        const {
          error: insertError,
        } =
          await supabase
            .from("products")
            .insert(
              productPayload
            );

        if (insertError) {
          throw new Error(
            insertError.message
          );
        }

        setSuccess(
          "Product added successfully."
        );
      }

      await loadProducts();

      window.setTimeout(
        () => {
          closeForm();
        },
        700
      );
    } catch (err) {
      console.error(
        "PRODUCT SAVE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(
    product: Product
  ) {
    const confirmed =
      window.confirm(
        `Delete "${product.name}"?`
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
          .from("products")
          .delete()
          .eq(
            "id",
            product.id
          );

      if (deleteError) {
        throw new Error(
          deleteError.message
        );
      }

      setProducts(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              product.id
          )
      );

      setSuccess(
        "Product deleted successfully."
      );
    } catch (err) {
      console.error(
        "PRODUCT DELETE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete product."
      );
    }
  }

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return products;
      }

      return products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(query) ||
          (
            product.brand ??
            ""
          )
            .toLowerCase()
            .includes(query) ||
          (
            product.category ??
            ""
          )
            .toLowerCase()
            .includes(query)
      );
    }, [
      products,
      search,
    ]);

  return (
    <AdminShell>
      <main className="admin-page">

        <Link
          href="/"
          className="products-back"
        >
          <ArrowLeft size={13} />
          DASHBOARD
        </Link>

        <div className="products-heading">
          <div>
            <span className="admin-eyebrow">
              A-POSITIVE / PRODUCT MANAGEMENT
            </span>

            <h1 className="admin-title">
              PRODUCTS
              <br />
              <em>CONTROL.</em>
            </h1>

            <p className="admin-subtitle">
              Add, edit and manage the products
              shown on the A-POSITIVE customer
              website.
            </p>
          </div>

          <button
            type="button"
            className="admin-primary-button product-add-button"
            onClick={openAddForm}
          >
            <Plus size={14} />
            ADD PRODUCT
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

        <div className="products-toolbar">

          <div className="products-count">
            <Package size={14} />

            <span>
              {filteredProducts.length}{" "}
              PRODUCT
              {filteredProducts.length !==
              1
                ? "S"
                : ""}
            </span>
          </div>

          <div className="products-search">
            <Search
              size={13}
              color="#999"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search products..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                <X size={13} />
              </button>
            )}
          </div>

        </div>

        {loading ? (
          <div className="admin-table-wrap">
            <div className="products-loading">
              LOADING PRODUCTS...
            </div>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table products-table">

              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>BRAND</th>
                  <th>CATEGORY</th>
                  <th>PRICE</th>
                  <th>STOCK</th>
                  <th>FEATURED</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map(
                  (product) => (
                    <tr
                      key={product.id}
                    >
                      <td>
                        <div className="admin-product-cell">

                          <div className="admin-product-image">
                            {product.image_url ? (
                              <img
                                src={
                                  product.image_url
                                }
                                alt={
                                  product.name
                                }
                              />
                            ) : (
                              <ImagePlus
                                size={16}
                              />
                            )}
                          </div>

                          <div>
                            <strong>
                              {
                                product.name
                              }
                            </strong>

                            {product.old_price !==
                              null &&
                              product.old_price !==
                                undefined && (
                                <small>
                                  OLD{" "}
                                  {formatPrice(
                                    product.old_price
                                  )}
                                </small>
                              )}
                          </div>

                        </div>
                      </td>

                      <td>
                        {
                          product.brand ??
                          "—"
                        }
                      </td>

                      <td>
                        {
                          product.category ??
                          "—"
                        }
                      </td>

                      <td>
                        <strong>
                          {formatPrice(
                            product.price
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={
                            product.stock ===
                            0
                              ? "stock-zero"
                              : product.stock !==
                                  null &&
                                product.stock <=
                                  5
                              ? "stock-low"
                              : "stock-ok"
                          }
                        >
                          {product.stock ??
                            0}
                        </span>
                      </td>

                      <td>
                        {product.featured ? (
                          <span className="featured-yes">
                            <Star
                              size={11}
                              fill="currentColor"
                            />
                            YES
                          </span>
                        ) : (
                          <span className="featured-no">
                            NO
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="product-actions">

                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                product
                              )
                            }
                            title="Edit product"
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteProduct(
                                product
                              )
                            }
                            title="Delete product"
                          >
                            <Trash2 size={13} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                )}

                {filteredProducts.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="products-empty-row"
                    >
                      NO PRODUCTS FOUND.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        )}

      </main>

      {showForm && (
        <div
          className="product-modal-backdrop"
          onClick={closeForm}
        >
          <div
            className="product-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="product-modal-header">

              <div>
                <span>
                  A-POSITIVE / PRODUCTS
                </span>

                <h2>
                  {editingProduct
                    ? "EDIT PRODUCT."
                    : "ADD PRODUCT."}
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
              onSubmit={handleSubmit}
              className="product-form"
            >

              {/* IMAGE */}

              <div className="product-image-upload">

                <div className="product-upload-preview">

                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                    />
                  ) : (
                    <ImagePlus
                      size={25}
                    />
                  )}

                </div>

                <label className="product-upload-button">
                  <ImagePlus size={13} />
                  {imageFile
                    ? "CHANGE IMAGE"
                    : "UPLOAD IMAGE"}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleImageChange
                    }
                    hidden
                  />
                </label>

              </div>

              {/* NAME */}

              <label>
                <span>
                  PRODUCT NAME
                </span>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Essential Oxford Shirt"
                  disabled={saving}
                />
              </label>

              <div className="product-form-grid">

                {/* BRAND */}

                <label>
                  <span>
                    BRAND
                  </span>

                  <select
                    value={form.brand}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        brand:
                          event.target
                            .value,
                      })
                    }
                    disabled={saving}
                  >
                    <option>
                      A-POSITIVE
                    </option>

                    <option>
                      BLUE DREAM
                    </option>

                    <option>
                      SHOPPING ZONE BD
                    </option>
                  </select>
                </label>

                {/* CATEGORY */}

                <label>
                  <span>
                    CATEGORY
                  </span>

                  <input
                    type="text"
                    value={
                      form.category
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category:
                          event.target
                            .value,
                      })
                    }
                    placeholder="SHIRT"
                    disabled={saving}
                  />
                </label>

              </div>

              <div className="product-form-grid">

                <label>
                  <span>
                    PRICE
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.price
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        price:
                          event.target
                            .value,
                      })
                    }
                    placeholder="1490"
                    disabled={saving}
                  />
                </label>

                <label>
                  <span>
                    OLD PRICE
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.old_price
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        old_price:
                          event.target
                            .value,
                      })
                    }
                    placeholder="1890"
                    disabled={saving}
                  />
                </label>

              </div>

              <div className="product-form-grid">

                <label>
                  <span>
                    STOCK
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.stock
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        stock:
                          event.target
                            .value,
                      })
                    }
                    placeholder="25"
                    disabled={saving}
                  />
                </label>

                <label className="featured-toggle">

                  <span>
                    FEATURED PRODUCT
                  </span>

                  <button
                    type="button"
                    className={
                      form.featured
                        ? "toggle active"
                        : "toggle"
                    }
                    onClick={() =>
                      setForm({
                        ...form,
                        featured:
                          !form.featured,
                      })
                    }
                    disabled={saving}
                  >
                    <span />
                    {form.featured
                      ? "YES"
                      : "NO"}
                  </button>

                </label>

              </div>

              {error && (
                <div className="product-form-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="admin-primary-button product-save-button"
                disabled={saving}
              >
                {saving
                  ? "SAVING..."
                  : editingProduct
                  ? "UPDATE PRODUCT"
                  : "ADD PRODUCT"}
              </button>

            </form>

          </div>
        </div>
      )}

      <style jsx>{`
        .products-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #77736c;
          text-decoration: none;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.3px;
        }

        .products-heading {
          margin-top: 34px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
        }

        .product-add-button {
          width: auto;
          min-width: 150px;
          padding: 0 18px;
          flex-shrink: 0;
        }

        .products-toolbar {
          margin-top: 38px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .products-count {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #99958e;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .products-search {
          width: min(320px, 100%);
          min-height: 36px;
          padding: 0 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #d8d4cc;
          background: #fff;
        }

        .products-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #111;
          font-size: 8px;
        }

        .products-search button {
          border: 0;
          padding: 0;
          display: grid;
          place-items: center;
          background: transparent;
          color: #777;
        }

        .products-loading {
          min-height: 300px;
          display: grid;
          place-items: center;
          color: #99958e;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.7px;
        }

        .products-table {
          min-width: 1000px;
        }

        .admin-product-cell {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 240px;
        }

        .admin-product-image {
          width: 46px;
          height: 56px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: #ece9e2;
          color: #999;
        }

        .admin-product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .admin-product-cell strong {
          display: block;
          color: #222;
          font-family: Georgia, serif;
          font-size: 12px;
          font-weight: 400;
          line-height: 1.2;
        }

        .admin-product-cell small {
          display: block;
          margin-top: 4px;
          color: #99958e;
          font-size: 6px;
        }

        .stock-ok {
          color: #286344;
          font-weight: 900;
        }

        .stock-low {
          color: #8b6b1f;
          font-weight: 900;
        }

        .stock-zero {
          color: #922d2d;
          font-weight: 900;
        }

        .featured-yes,
        .featured-no {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 7px;
          font-weight: 900;
        }

        .featured-yes {
          color: #8b6b1f;
        }

        .featured-no {
          color: #99958e;
        }

        .product-actions {
          display: flex;
          gap: 7px;
        }

        .product-actions button {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border: 1px solid #ddd9d0;
          background: #fff;
          color: #555;
          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .product-actions button:first-child:hover {
          background: #111;
          color: #fff;
        }

        .product-actions button:last-child:hover {
          background: #963434;
          border-color: #963434;
          color: #fff;
        }

        .products-empty-row {
          padding: 60px !important;
          text-align: center;
          color: #99958e !important;
          font-size: 8px !important;
          font-weight: 900 !important;
          letter-spacing: 1.5px;
        }

        .product-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 500;
          padding: 20px;
          display: grid;
          place-items: center;
          background: rgba(17, 17, 15, 0.48);
          backdrop-filter: blur(10px);
        }

        .product-modal {
          width: min(650px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          padding: 28px;
          background: #f8f6f1;
          box-shadow: 0 35px 100px rgba(0, 0, 0, 0.28);
        }

        .product-modal-header {
          margin-bottom: 25px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .product-modal-header > div > span {
          display: block;
          margin-bottom: 8px;
          color: #99958e;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.6px;
        }

        .product-modal-header h2 {
          margin: 0;
          font-family: Georgia, serif;
          font-size: 29px;
          font-weight: 400;
          letter-spacing: -1px;
        }

        .product-modal-header button {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid #d4d0c7;
          background: transparent;
          color: #111;
        }

        .product-form {
          display: grid;
          gap: 15px;
        }

        .product-form label {
          display: block;
        }

        .product-form label > span {
          display: block;
          margin-bottom: 7px;
          color: #85817a;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .product-form input,
        .product-form select {
          width: 100%;
          min-height: 43px;
          padding: 0 12px;
          border: 1px solid #d2cec5;
          outline: 0;
          background: #fff;
          color: #111;
          font-size: 9px;
        }

        .product-form input:focus,
        .product-form select:focus {
          border-color: #111;
        }

        .product-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .product-image-upload {
          display: grid;
          grid-template-columns: 115px 1fr;
          gap: 15px;
          align-items: center;
        }

        .product-upload-preview {
          width: 115px;
          height: 135px;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: #ebe8e1;
          color: #999;
        }

        .product-upload-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-upload-button {
          min-height: 42px;
          padding: 0 14px;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #111;
          background: #111;
          color: #fff;
          cursor: pointer;
          font-size: 7px !important;
          letter-spacing: 1.2px !important;
        }

        .featured-toggle {
          display: flex !important;
          flex-direction: column;
          justify-content: flex-start;
        }

        .toggle {
          min-height: 43px;
          padding: 0 13px;
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid #d2cec5;
          background: #fff;
          color: #777;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .toggle > span {
          width: 15px;
          height: 15px;
          display: block;
          border: 1px solid #bbb7af;
          background: #fff;
        }

        .toggle.active {
          border-color: #111;
          background: #111;
          color: #fff;
        }

        .toggle.active > span {
          border-color: #b99a55;
          background: #b99a55;
        }

        .product-form-error {
          padding: 11px 12px;
          border: 1px solid #ead3d3;
          background: #f8eaea;
          color: #963434;
          font-size: 8px;
          line-height: 1.6;
        }

        .product-save-button {
          margin-top: 4px;
        }

        @media (max-width: 700px) {
          .products-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .product-add-button {
            width: 100%;
          }

          .products-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .products-search {
            width: 100%;
          }
        }

        @media (max-width: 520px) {
          .product-modal {
            padding: 20px;
          }

          .product-form-grid {
            grid-template-columns: 1fr;
          }

          .product-image-upload {
            grid-template-columns: 90px 1fr;
          }

          .product-upload-preview {
            width: 90px;
            height: 110px;
          }
        }
      `}</style>
    </AdminShell>
  );
}