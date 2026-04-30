import { createCardElement, deleteCardElement, likeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import {
  getUserInfo, getCardList, setUserInfo, setUserAvatar,
  createCard, deleteCard
} from "./components/api.js";

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const removeCardModalWindow = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardModalWindow.querySelector(".popup__form");

const usersStatsModalWindow = document.querySelector(".popup_type_info");
const usersStatsModalInfoList = usersStatsModalWindow.querySelector(".popup__info");
const usersStatsModalUserList = usersStatsModalWindow.querySelector(".popup__list");

const headerLogo = document.querySelector(".header__logo");

let cardElementToDelete = null;
let cardIdToDelete = null;

const confirmCardDeletion = (cardElement, cardId) => {
  cardElementToDelete = cardElement;
  cardIdToDelete = cardId;
  openModalWindow(removeCardModalWindow);
};

const toggleLoadingState = (
  isLoading, submitButton, defaultText = "Сохранить", loadingText = "Сохранение..."
) => {
  if (isLoading) {
    submitButton.textContent = loadingText;
  } else {
    submitButton.textContent = defaultText;
  }
}

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();

  const submitButton = evt.submitter;
  toggleLoadingState(true, submitButton);

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      toggleLoadingState(false, submitButton);
    });
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();

  const submitButton = evt.submitter;
  toggleLoadingState(true, submitButton);

  setUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      avatarForm.reset();
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      toggleLoadingState(false, submitButton);
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();

  const submitButton = evt.submitter;
  toggleLoadingState(true, submitButton, "Создать", "Создание...");

  createCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      placesWrap.prepend(
        createCardElement(cardData, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: likeCard,
          onDeleteCard: confirmCardDeletion,
        }, cardData.owner._id)
      );
      cardForm.reset();
      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      toggleLoadingState(false, submitButton, "Создать");
    });
};

const handleRemoveCard = (evt) => {
  evt.preventDefault();
  if (cardElementToDelete && cardIdToDelete) {
    const submitButton = evt.submitter;
    toggleLoadingState(true, submitButton, "Да", "Удаление...");

    deleteCard(cardIdToDelete)
      .then(() => {
        deleteCardElement(cardElementToDelete);
        closeModalWindow(removeCardModalWindow);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        toggleLoadingState(false, submitButton, "Да");
      });
  }
};

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const createInfoString = (term, description) => {
  const item = document
    .getElementById("popup-info-definition-template")
    .content.querySelector(".popup__info-item")
    .cloneNode(true);
  
  item.querySelector(".popup__info-term").textContent = term;
  item.querySelector(".popup__info-description").textContent = description;

  return item;
};

const createUserPreview = (userName) => {
  const item = document
    .getElementById("popup-info-user-preview-template")
    .content.querySelector(".popup__list-item")
    .cloneNode(true);

  item.textContent = `${userName}`;

  return item;
};

const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      usersStatsModalInfoList.innerHTML = "";
      usersStatsModalUserList.innerHTML = "";

      usersStatsModalInfoList.append(
        createInfoString(
          "Всего карточек:",
          cards.length
        )
      );

      usersStatsModalInfoList.append(
        createInfoString(
          "Первая создана:",
          formatDate(new Date(cards[cards.length - 1].createdAt))
        )
      );

      usersStatsModalInfoList.append(
        createInfoString(
          "Последняя создана:",
          formatDate(new Date(cards[0].createdAt))
        )
      );
      
      const userNames = new Set();

      cards.forEach(card => {
        userNames.add(card.owner.name);
        card.likes.forEach(user => userNames.add(user.name));
      });

      usersStatsModalInfoList.append(
        createInfoString(
          "Всего пользователей:",
          userNames.size
        )
      );

      const cardCountByOwner = cards.reduce((acc, card) => {
        const name = card.owner.name;
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      usersStatsModalInfoList.append(
        createInfoString(
          "Максимум карточек от одного:",
          Math.max(...Object.values(cardCountByOwner))
        )
      );

      userNames.forEach((userName) => {
        usersStatsModalUserList.append(createUserPreview(userName));
      });
      
      openModalWindow(usersStatsModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);

removeCardForm.addEventListener("submit", handleRemoveCard);
headerLogo.addEventListener("click", handleLogoClick);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  openModalWindow(profileFormModalWindow);
  clearValidation(profileForm, validationSettings);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  openModalWindow(avatarFormModalWindow);
  clearValidation(avatarForm, validationSettings);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  openModalWindow(cardFormModalWindow);
  clearValidation(cardForm, validationSettings);
});

const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

enableValidation(validationSettings);

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((data) => {
      placesWrap.append(
        createCardElement(data, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: likeCard,
          onDeleteCard: confirmCardDeletion,
        }, userData._id)
      );
    });
  })
  .catch((err) => {
    console.log(err);
  });
