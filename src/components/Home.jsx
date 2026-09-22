import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Typography,
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import PeopleIcon from "@mui/icons-material/People";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import coffinImage from "../assets/images/coffin.jpg";
import logoHie from "../assets/images/logo-hie.jpg";
import logoWsc from "../assets/images/logo-wsc.jpg";

const pageBackground = {
  minHeight: "100%",
  background:
    "linear-gradient(180deg, rgb(204, 255, 255) 0%, rgb(232, 248, 255) 55%, #eef6f8 100%)",
};

const cardSx = {
  height: "100%",
  borderRadius: 3,
  boxShadow: "0 10px 30px rgba(48, 46, 47, 0.08)",
  border: "1px solid rgba(48, 46, 47, 0.06)",
  backgroundColor: "rgba(255,255,255,0.92)",
};

const imageHoverSx = {
  overflow: "hidden",
  transition: "transform 0.35s ease, box-shadow 0.35s ease",
  "& img": {
    transition: "transform 0.5s ease, filter 0.35s ease",
  },
  "@media (hover: hover)": {
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 18px 40px rgba(48, 46, 47, 0.18)",
    },
    "&:hover img": {
      transform: "scale(1.06)",
      filter: "brightness(1.06) saturate(1.08)",
    },
  },
};

function FeatureCard({ icon, title, description, to, actionLabel, canBrowse }) {
  const content = (
    <CardContent
      sx={{
        p: { xs: 2, md: 3 },
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          width: { xs: 40, md: 48 },
          height: { xs: 40, md: 48 },
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          bgcolor: "rgba(48, 46, 47, 0.08)",
          color: "primary.main",
          mb: { xs: 1.5, md: 2 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: "1.05rem", md: "1.25rem" } }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
        {description}
      </Typography>
      {canBrowse && (
        <Typography
          variant="button"
          sx={{
            mt: 2,
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            color: "primary.main",
          }}
        >
          {actionLabel}
          <ArrowForwardIcon fontSize="small" />
        </Typography>
      )}
    </CardContent>
  );

  return (
    <Card sx={cardSx}>
      {canBrowse ? (
        <CardActionArea component={Link} to={to} sx={{ height: "100%" }}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}

function PartnerCard({ src, alt, title }) {
  return (
    <Card
      sx={{
        ...cardSx,
        ...imageHoverSx,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: { xs: 1, md: 1.5 },
          p: { xs: 1.25, md: 2 },
        }}
      >
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{
            width: "100%",
            flex: 1,
            minHeight: 0,
            maxHeight: { xs: 88, sm: 110, md: "100%" },
            objectFit: "contain",
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "0.75rem", md: "0.9rem" },
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
}

function Home({ user }) {
  const { t } = useI18n();
  const role = user?.role || "";
  const canBrowseCollection =
    role === "edit" || role === "superadmin" || role === "view";
  const canBrowseUsers = role === "superadmin";

  return (
    <Box sx={pageBackground}>
      <Box
        sx={{
          height: { md: "calc(100dvh - 64px)" },
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          overflow: { md: "hidden" },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            py: { xs: 2, md: 2.5 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Card sx={{ ...cardSx, height: "auto", flexShrink: 0, mb: { xs: 1.5, md: 2 } }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: { xs: 2, md: 2.5 } } }}>
              <Typography
                variant="overline"
                sx={{ letterSpacing: 1.4, color: "text.secondary", display: { xs: "none", sm: "block" } }}
              >
                DCSAEAT
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: { xs: 0.75, md: 1 },
                  fontSize: { xs: "1.5rem", sm: "1.85rem", md: "2.15rem" },
                  lineHeight: 1.2,
                }}
              >
                {t("home.welcome")}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  maxWidth: 820,
                  lineHeight: 1.55,
                  display: "-webkit-box",
                  WebkitLineClamp: { xs: 3, md: 2 },
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {t("home.subtitle")}
              </Typography>
            </CardContent>
          </Card>

          <Box
            sx={{
              flex: { xs: "0 0 auto", md: 1 },
              minHeight: { xs: 240, md: 0 },
              display: "grid",
              gridTemplateColumns: "1fr",
              gridTemplateRows: { xs: "auto auto", md: "minmax(0, 1.75fr) minmax(140px, 0.7fr)" },
              gap: { xs: 1.5, md: 2 },
            }}
          >
            <Card
              sx={{
                ...cardSx,
                ...imageHoverSx,
                position: "relative",
                height: { xs: 210, sm: 260, md: "100%" },
                minHeight: { md: 0 },
              }}
            >
              <Box
                component="img"
                src={coffinImage}
                alt={t("home.featuredAlt")}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  px: { xs: 1.5, md: 2 },
                  py: { xs: 1, md: 1.25 },
                  background: "linear-gradient(180deg, transparent, rgba(20,18,18,0.72))",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "common.white",
                    fontSize: { xs: "0.75rem", md: "0.85rem" },
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {t("home.featuredCaption")}
                </Typography>
              </Box>
            </Card>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: { xs: 1.5, md: 2 },
                minHeight: { xs: 150, md: 0 },
              }}
            >
              <PartnerCard
                src={logoHie}
                alt={t("home.logoHieAlt")}
                title={t("home.logoHie")}
              />
              <PartnerCard
                src={logoWsc}
                alt={t("home.logoWscAlt")}
                title={t("home.logoWsc")}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: { xs: 5, md: 7 }, pt: { xs: 1, md: 1.5 }, px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 2, md: 3 },
          }}
        >
          <FeatureCard
            icon={<Inventory2Icon />}
            title={t("home.objectsTitle")}
            description={t("home.objectsDesc")}
            to="/objects"
            actionLabel={t("home.browse")}
            canBrowse={canBrowseCollection}
          />
          <FeatureCard
            icon={<BookmarksIcon />}
            title={t("home.referencesTitle")}
            description={t("home.referencesDesc")}
            to="/references"
            actionLabel={t("home.browse")}
            canBrowse={canBrowseCollection}
          />
          <FeatureCard
            icon={<PeopleIcon />}
            title={t("home.usersTitle")}
            description={t("home.usersDesc")}
            to="/users"
            actionLabel={t("home.browse")}
            canBrowse={canBrowseUsers}
          />
        </Box>
      </Container>
    </Box>
  );
}

export default Home;
