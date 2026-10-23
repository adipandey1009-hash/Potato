package com.potato.config;

import com.potato.entity.*;
import com.potato.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${potato.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${potato.seed.admin-email:admin@potato.local}")
    private String adminEmail;

    @Value("${potato.seed.admin-password:PotatoAdmin123!}")
    private String adminPassword;

    @Value("${potato.seed.kitchen-email:kitchen@potato.local}")
    private String kitchenEmail;

    @Value("${potato.seed.kitchen-password:PotatoKitchen123!}")
    private String kitchenPassword;

    @Value("${potato.seed.customer-email:customer@potato.local}")
    private String customerEmail;

    @Value("${potato.seed.customer-password:PotatoDemo123!}")
    private String customerPassword;

    public DataInitializer(
        UserRepository userRepository,
        AddressRepository addressRepository,
        RestaurantRepository restaurantRepository,
        MenuCategoryRepository categoryRepository,
        MenuItemRepository menuItemRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.restaurantRepository = restaurantRepository;
        this.categoryRepository = categoryRepository;
        this.menuItemRepository = menuItemRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }

        // 1. Seed Admin
        if (!userRepository.existsByEmailIgnoreCase(adminEmail)) {
            User admin = new User("Potato Admin", adminEmail, passwordEncoder.encode(adminPassword), Role.ADMIN);
            userRepository.save(admin);
            log.info("Seeded Admin user: {}", adminEmail);
        }

        // 2. Seed Kitchen Staff
        if (!userRepository.existsByEmailIgnoreCase(kitchenEmail)) {
            User kitchen = new User("Chef Marco (Kitchen Lead)", kitchenEmail, passwordEncoder.encode(kitchenPassword), Role.KITCHEN_STAFF);
            userRepository.save(kitchen);
            log.info("Seeded Kitchen Staff user: {}", kitchenEmail);
        }

        // 3. Seed Customer
        if (!userRepository.existsByEmailIgnoreCase(customerEmail)) {
            User customer = new User("Anshika Sharma", customerEmail, passwordEncoder.encode(customerPassword), Role.CUSTOMER);
            User savedCustomer = userRepository.save(customer);

            Address defaultAddress = new Address(
                savedCustomer,
                "Penthouse Loft",
                "Anshika Sharma",
                "+1 (555) 019-2834",
                "742 Evergreen Terrace",
                "Apt 12B",
                "Springfield",
                "OR",
                "97477",
                "Ring buzzer 12B, leave package with front concierge if unavailable.",
                true
            );
            addressRepository.save(defaultAddress);
            log.info("Seeded Customer user: {} with default delivery address", customerEmail);
        }

        // 4. Seed fallback restaurants if table is empty (e.g. in test H2 database)
        if (restaurantRepository.count() == 0) {
            seedFallbackRestaurants();
        }
    }

    private void seedFallbackRestaurants() {
        Restaurant r1 = new Restaurant(
            "The Rustic Spud",
            "the-rustic-spud",
            "Artisan hand-smashed potatoes, slow-roasted root bowls, and handcrafted savoury gravies.",
            "Artisan Comfort",
            "https://images.unsplash.com/photo-1518013034458-30d08553a646?auto=format&fit=crop&w=1200&q=80",
            new BigDecimal("2.99"),
            20,
            35
        );
        restaurantRepository.save(r1);

        MenuCategory cat1 = new MenuCategory(r1, "Signature Spud Bowls", 1);
        MenuCategory cat2 = new MenuCategory(r1, "Handcrafted Sides", 2);
        categoryRepository.saveAll(List.of(cat1, cat2));

        MenuItem item1 = new MenuItem(
            r1, cat1, "Truffle Confit Smash Bowl",
            "Crispy smashed Yukon golds, winter truffle butter, shaved pecorino, and wild garden chives.",
            new BigDecimal("16.50"),
            "https://images.unsplash.com/photo-1518013034458-30d08553a646?auto=format&fit=crop&w=800&q=80",
            true, true
        );
        MenuItem item2 = new MenuItem(
            r1, cat1, "Braised Short Rib Hearth Potato",
            "Smoked butter-roasted Russet loaded with 12-hour braised beef short rib, rich demi-glace, and sour cream.",
            new BigDecimal("21.00"),
            "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
            true, false
        );
        MenuItem item3 = new MenuItem(
            r1, cat2, "Herb Sea Salt Potato Croquettes",
            "Panko-crusted Idaho mash with gruyère center, paired with roasted garlic aioli.",
            new BigDecimal("9.50"),
            "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80",
            true, true
        );
        menuItemRepository.saveAll(List.of(item1, item2, item3));

        Restaurant r2 = new Restaurant(
            "Verdant Hearth",
            "verdant-hearth",
            "Farm-to-table botanical plates, heirloom grains, and fire-kissed seasonal greens.",
            "Organic & Clean",
            "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
            new BigDecimal("3.49"),
            25,
            40
        );
        restaurantRepository.save(r2);

        MenuCategory cat3 = new MenuCategory(r2, "Heirloom Salads & Bowls", 1);
        categoryRepository.save(cat3);

        MenuItem item4 = new MenuItem(
            r2, cat3, "Charred Broccolini & Ancient Grains",
            "Spelt and farro pilaf, charred broccolini, tahini green goddess, and crushed marcona almonds.",
            new BigDecimal("17.50"),
            "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
            true, true
        );
        menuItemRepository.save(item4);

        log.info("Fallback restaurants and menu items seeded.");
    }
}
