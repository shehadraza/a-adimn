"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AdminShellProps = {
  children: ReactNode;
};

export default function AdminShell({
  children,
}: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [checking, setChecking] =
    useState(true);

  const [email, setEmail] =
    useState("");

  const [menuOpen, setMenuOpen] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      try {
        const {
          data,
          error,
        } = await supabase.auth.getUser();

        if (
          error ||
          !data.user
        ) {
          router.replace("/login");
          return;
        }

        const {
          data: admin,
          error: adminError,
        } = await supabase
          .from("admin_users")
          .select(
            "id,email,role,active"
          )
          .eq(
            "id",
            data.user.id
          )
          .eq(
            "active",
            true
          )
          .eq(
            "role",
            "admin"
          )
          .maybeSingle();

        if (adminError) {
          console.error(
            "ADMIN CHECK ERROR:",
            adminError.message
          );

          router.replace("/login");
          return;
        }

        if (!admin) {
          await supabase.auth.signOut();

          router.replace("/login");
          return;
        }

        if (mounted) {
          setEmail(
            admin.email ||
              data.user.email ||
              ""
          );

          setChecking(false);
        }
      } catch (error) {
        console.error(
          "ADMIN ACCESS ERROR:",
          error
        );

        router.replace("/login");
      }
    }

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [
    router,
    supabase,
  ]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function logout() {
    setMenuOpen(false);

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  if (checking) {
    return (
      <main className="admin-loading">
        CHECKING ADMIN ACCESS...
      </main>
    );
  }

  return (
    <div className="admin-shell">

      {/* =====================================================
          ADMIN NAVBAR
      ====================================================== */}

      <header className="admin-nav">
        <div className="admin-nav-inner">

          {/* LOGO */}

          <Link
            href="/"
            className="admin-logo"
          >
            A-
            <span>POSITIVE</span>{" "}
            ADMIN
          </Link>

          {/* DESKTOP NAVIGATION */}

          <nav className="admin-nav-links">

            {/* DASHBOARD */}

            <Link
              href="/"
              className={
                pathname === "/"
                  ? "font-bold"
                  : ""
              }
            >
              <LayoutDashboard
                size={12}
              />
              DASHBOARD
            </Link>

            {/* ORDERS */}

            <Link
              href="/orders"
              className={
                pathname.startsWith(
                  "/orders"
                )
                  ? "font-bold"
                  : ""
              }
            >
              <ShoppingBag
                size={12}
              />
              ORDERS
            </Link>

            {/* CUSTOMERS */}

            <Link
              href="/customers"
              className={
                pathname.startsWith(
                  "/customers"
                )
                  ? "font-bold"
                  : ""
              }
            >
              <Users size={12} />
              CUSTOMERS
            </Link>

            {/* PRODUCTS */}

            <Link
              href="/products"
              className={
                pathname.startsWith(
                  "/products"
                )
                  ? "font-bold"
                  : ""
              }
            >
              <Package size={12} />
              PRODUCTS
            </Link>

            {/* BRANDS */}

            <Link
              href="/brands"
              className={
                pathname.startsWith(
                  "/brands"
                )
                  ? "font-bold"
                  : ""
              }
            >
              BRANDS
            </Link>

            {/* HERO */}

            <Link
              href="/hero"
              className={
                pathname.startsWith(
                  "/hero"
                )
                  ? "font-bold"
                  : ""
              }
            >
              HERO
            </Link>

            {/* OFFERS */}

            <Link
              href="/offers"
              className={
                pathname.startsWith(
                  "/offers"
                )
                  ? "font-bold"
                  : ""
              }
            >
              OFFERS
            </Link>

          </nav>

          {/* MOBILE MENU BUTTON */}

          <button
            type="button"
            className="admin-mobile-menu-button"
            onClick={() =>
              setMenuOpen(
                (value) => !value
              )
            }
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X size={18} />
            ) : (
              <Menu size={18} />
            )}
          </button>

          {/* ADMIN USER */}

          <div className="admin-user">

            <span className="admin-user-email">
              {email}
            </span>

            <button
              type="button"
              className="admin-logout"
              onClick={logout}
            >
              <LogOut size={12} />
              LOGOUT
            </button>

          </div>

          {/* =================================================
              MOBILE NAVIGATION
          ================================================== */}

          {menuOpen && (
            <div className="admin-mobile-menu">

              <Link
                href="/"
                className={
                  pathname === "/"
                    ? "mobile-active"
                    : ""
                }
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                <LayoutDashboard
                  size={13}
                />
                DASHBOARD
              </Link>

              <Link
                href="/orders"
                className={
                  pathname.startsWith(
                    "/orders"
                  )
                    ? "mobile-active"
                    : ""
                }
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                <ShoppingBag
                  size={13}
                />
                ORDERS
              </Link>

              <Link
                href="/customers"
                className={
                  pathname.startsWith(
                    "/customers"
                  )
                    ? "mobile-active"
                    : ""
                }
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                <Users size={13} />
                CUSTOMERS
              </Link>

              <Link
                href="/products"
                className={
                  pathname.startsWith(
                    "/products"
                  )
                    ? "mobile-active"
                    : ""
                }
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                <Package size={13} />
                PRODUCTS
              </Link>

              <Link
                href="/brands"
                className={
                  pathname.startsWith(
                    "/brands"
                  )
                    ? "mobile-active"
                    : ""
                }
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                BRANDS
              </Link>

              <Link
                href="/hero"
                className={
                  pathname.startsWith(
                    "/hero"
                  )
                    ? "mobile-active"
                    : ""
                }
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                HERO
              </Link>

              <Link
                href="/offers"
                className={
                  pathname.startsWith(
                    "/offers"
                  )
                    ? "mobile-active"
                    : ""
                }
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                OFFERS
              </Link>

            </div>
          )}

        </div>
      </header>

      {/* PAGE CONTENT */}

      {children}

    </div>
  );
}