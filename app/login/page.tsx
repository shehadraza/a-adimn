"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  LockKeyhole,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      try {
        const {
          data,
          error: sessionError,
        } =
          await supabase.auth.getUser();

        if (
          sessionError ||
          !data.user
        ) {
          return;
        }

        const {
          data: admin,
          error: adminError,
        } =
          await supabase
            .from("admin_users")
            .select(
              "id,email,role,active"
            )
            .eq(
              "id",
              data.user.id
            )
            .eq(
              "role",
              "admin"
            )
            .eq(
              "active",
              true
            )
            .maybeSingle();

        if (
          adminError ||
          !admin
        ) {
          return;
        }

        if (mounted) {
          router.replace("/");
        }
      } catch (error) {
        console.error(
          "SESSION CHECK ERROR:",
          error
        );
      }
    }

    checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const cleanEmail =
      email.trim();

    if (!cleanEmail) {
      setError(
        "Please enter your admin email."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    setLoading(true);

    try {
      /* =========================================
         AUTH LOGIN
      ========================================= */

      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              cleanEmail,
            password,
          }
        );

      if (loginError) {
        throw new Error(
          loginError.message
        );
      }

      if (!data.user) {
        throw new Error(
          "Login failed."
        );
      }

      /* =========================================
         CHECK ADMIN USER
      ========================================= */

      const {
        data: admin,
        error: adminError,
      } =
        await supabase
          .from("admin_users")
          .select(
            "id,email,role,active"
          )
          .eq(
            "id",
            data.user.id
          )
          .eq(
            "role",
            "admin"
          )
          .eq(
            "active",
            true
          )
          .maybeSingle();

      if (adminError) {
        console.error(
          "ADMIN CHECK ERROR MESSAGE:",
          adminError.message
        );

        console.error(
          "ADMIN CHECK ERROR DETAILS:",
          adminError.details
        );

        console.error(
          "ADMIN CHECK ERROR HINT:",
          adminError.hint
        );

        console.error(
          "ADMIN CHECK ERROR CODE:",
          adminError.code
        );

        throw new Error(
          adminError.message
        );
      }

      if (!admin) {
        await supabase.auth.signOut();

        throw new Error(
          "This account does not have admin access."
        );
      }

      /* =========================================
         LOGIN SUCCESS
      ========================================= */

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error(
        "ADMIN LOGIN ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <form
        className="admin-login-card"
        onSubmit={handleLogin}
      >
        {/* LOGO */}

        <div className="admin-login-logo">
          A-
          <span>POSITIVE</span>
          {" "}
          ADMIN
        </div>

        {/* HEADING */}

        <h1>
          CONTROL
          <br />
          <em>CENTER.</em>
        </h1>

        <p>
          Authorized access only. Manage orders,
          payment verification and the A-POSITIVE
          commerce system from one place.
        </p>

        {/* EMAIL */}

        <label className="admin-field">
          <span>
            ADMIN EMAIL
          </span>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="admin@example.com"
            autoComplete="email"
            disabled={loading}
          />
        </label>

        {/* PASSWORD */}

        <label className="admin-field">
          <span>
            PASSWORD
          </span>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading}
          />
        </label>

        {/* ERROR */}

        {error && (
          <div
            className="admin-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* BUTTON */}

        <button
          type="submit"
          className="admin-primary-button"
          disabled={loading}
        >
          {loading ? (
            "SIGNING IN..."
          ) : (
            <>
              ENTER ADMIN
              <ArrowRight size={15} />
            </>
          )}
        </button>

        {/* SECURITY */}

        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems:
              "center",
            gap: 7,
            color: "#999",
            fontSize: 7,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          <LockKeyhole size={11} />
          SECURE SUPABASE AUTHENTICATION
        </div>
      </form>
    </main>
  );
}