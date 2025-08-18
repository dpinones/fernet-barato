use starknet::ContractAddress;
use snforge_std::{declare, DeclareResultTrait, ContractClassTrait, start_cheat_caller_address, stop_cheat_caller_address, 
                  start_cheat_block_timestamp, stop_cheat_block_timestamp};
use fernet_barato::{IFernetBaratoDispatcher, IFernetBaratoDispatcherTrait};

fn OWNER() -> ContractAddress {
    'owner'.try_into().unwrap()
}

fn USER1() -> ContractAddress {
    'user1'.try_into().unwrap()
}

fn USER2() -> ContractAddress {
    'user2'.try_into().unwrap()
}

fn deploy_contract() -> IFernetBaratoDispatcher {
    let contract = declare("FernetBarato").unwrap().contract_class();
    let constructor_calldata = array![OWNER().into()];
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    IFernetBaratoDispatcher { contract_address }
}

#[test]
fn test_create_mock_stores_and_prices() {
    let contract = deploy_contract();
    
    // Set timestamp to a realistic date (January 15, 2024)
    start_cheat_block_timestamp(contract.contract_address, 1705334400);
    start_cheat_caller_address(contract.contract_address, OWNER());
    
    // Mock Store 1: Carrefour Villa Crespo
    let store1_id = contract.add_store(
        "Carrefour Villa Crespo",
        "Av. Corrientes 4817, Villa Crespo, CABA", 
        "+54 11 4857-3200",
        "Lun-Dom: 8:00-22:00",
        "https://www.carrefour.com.ar/tiendas/villa-crespo"
    );
    
    // Mock Store 2: Disco Palermo
    let store2_id = contract.add_store(
        "Disco Palermo",
        "Av. Santa Fe 3253, Palermo, CABA",
        "+54 11 4831-9500", 
        "Lun-Sab: 8:00-24:00, Dom: 9:00-22:00",
        "https://www.disco.com.ar/tienda/palermo"
    );
    
    // Mock Store 3: Coto Belgrano
    let store3_id = contract.add_store(
        "Coto Belgrano",
        "Av. Cabildo 2602, Belgrano, CABA",
        "+54 11 4781-4500",
        "Lun-Dom: 8:30-21:30", 
        "https://www.coto.com.ar/sucursales/belgrano"
    );
    
    // Mock Store 4: Jumbo Unicenter
    let store4_id = contract.add_store(
        "Jumbo Unicenter",
        "Parana 3745, Martinez, Buenos Aires",
        "+54 11 4837-8000",
        "Lun-Dom: 8:00-22:00",
        "https://www.jumbo.com.ar/tienda/unicenter"
    );
    
    // Mock Store 5: La Anonima Recoleta  
    let store5_id = contract.add_store(
        "La Anonima Recoleta",
        "Av. Las Heras 2100, Recoleta, CABA",
        "+54 11 4801-2300",
        "Lun-Sab: 7:30-24:00, Dom: 8:00-23:00",
        "https://www.laanonimaonline.com.ar/recoleta"
    );
    
    // Add realistic Fernet Branca prices (in pesos argentinos * 100 to avoid decimals)
    // January 2024 prices
    
    // Carrefour - competitive prices
    contract.update_price(store1_id, 180000); // $1,800.00
    
    // Disco - premium location, higher prices  
    contract.update_price(store2_id, 195000); // $1,950.00
    
    // Coto - mid-range prices
    contract.update_price(store3_id, 175000); // $1,750.00
    
    // Jumbo - bulk/family store, good prices
    contract.update_price(store4_id, 165000); // $1,650.00
    
    // La Anonima - local chain, competitive
    contract.update_price(store5_id, 172000); // $1,720.00
    
    stop_cheat_caller_address(contract.contract_address);
    
    // Simulate price updates over time (February 2024)
    start_cheat_block_timestamp(contract.contract_address, 1708012800); // Feb 15, 2024
    start_cheat_caller_address(contract.contract_address, OWNER());
    
    // Price increases due to inflation
    contract.update_price(store1_id, 189000); // $1,890.00
    contract.update_price(store2_id, 205000); // $2,050.00  
    contract.update_price(store3_id, 184000); // $1,840.00
    contract.update_price(store4_id, 175000); // $1,750.00
    contract.update_price(store5_id, 181000); // $1,810.00
    
    stop_cheat_caller_address(contract.contract_address);
    
    // Add some user interactions
    start_cheat_caller_address(contract.contract_address, USER1());
    
    // User1 gives thanks to Jumbo (best price)
    contract.give_thanks(store4_id);
    
    // User1 reports incorrect price at Disco
    contract.submit_report(store2_id, "El precio mostrado no coincide con el de gondola");
    
    stop_cheat_caller_address(contract.contract_address);
    
    // User2 also gives thanks to Jumbo and Coto
    start_cheat_caller_address(contract.contract_address, USER2());
    contract.give_thanks(store4_id);
    contract.give_thanks(store3_id);
    
    stop_cheat_caller_address(contract.contract_address);
    stop_cheat_block_timestamp(contract.contract_address);
    
    // Verify mock data
    let all_stores = contract.get_all_stores();
    assert!(all_stores.len() == 5, "Should have 5 stores");
    
    let all_prices = contract.get_all_current_prices();
    assert!(all_prices.len() == 5, "Should have 5 current prices");
    
    // Check thanks counts
    assert!(contract.get_thanks_count(store4_id) == 2, "Jumbo should have 2 thanks");
    assert!(contract.get_thanks_count(store3_id) == 1, "Coto should have 1 thanks");
    
    println!("=== MOCK DATA CREATED SUCCESSFULLY ===");
    println!("Stores created: {}", all_stores.len());
    println!("Current prices: {}", all_prices.len());
    println!("Jumbo thanks: {}", contract.get_thanks_count(store4_id));
    println!("Coto thanks: {}", contract.get_thanks_count(store3_id));
    println!("=====================================");
}

#[test] 
fn test_mock_data_price_history() {
    let contract = deploy_contract();
    
    start_cheat_block_timestamp(contract.contract_address, 1705334400);
    start_cheat_caller_address(contract.contract_address, OWNER());
    
    // Create one store for detailed testing
    let store_id = contract.add_store(
        "Test Fernet Store",
        "Av. Test 1234, Test City", 
        "+54 11 1234-5678",
        "Lun-Dom: 9:00-21:00",
        "https://test-store.com"
    );
    
    // Add multiple price updates to test history
    contract.update_price(store_id, 150000); // $1,500.00
    
    // Move forward in time and update price
    start_cheat_block_timestamp(contract.contract_address, 1705420800); // +1 day
    contract.update_price(store_id, 155000); // $1,550.00
    
    start_cheat_block_timestamp(contract.contract_address, 1705507200); // +2 days  
    contract.update_price(store_id, 160000); // $1,600.00
    
    stop_cheat_caller_address(contract.contract_address);
    
    // Test price history
    let price_history = contract.get_price_history(store_id);
    assert!(price_history.len() == 3, "Should have 3 price entries");
    
    // Test current price
    let current_price = contract.get_current_price(store_id);
    assert!(current_price.price == 160000, "Current price should be $1,600.00");
    
    // Test store retrieval
    let store = contract.get_store(store_id);
    assert!(store.name == "Test Fernet Store", "Store name should match");
    
    println!("=== PRICE HISTORY TEST PASSED ===");
    println!("Store ID: {}", store_id);
    println!("Price history entries: {}", price_history.len());
    println!("Current price: ${}", current_price.price / 100);
    println!("=================================");
}

#[test]
fn test_thanks_system() {
    let contract = deploy_contract();
    
    start_cheat_block_timestamp(contract.contract_address, 1705334400);
    start_cheat_caller_address(contract.contract_address, OWNER());
    
    // Create test store
    let store_id = contract.add_store(
        "Thanks Test Store",
        "Test Address 123",
        "+54 11 0000-0000",
        "Always Open",
        "https://test.com"
    );
    
    contract.update_price(store_id, 100000); // $1,000.00
    
    stop_cheat_caller_address(contract.contract_address);
    
    // User1 gives thanks
    start_cheat_caller_address(contract.contract_address, USER1());
    contract.give_thanks(store_id);
    stop_cheat_caller_address(contract.contract_address);
    
    // User2 gives thanks
    start_cheat_caller_address(contract.contract_address, USER2());
    contract.give_thanks(store_id);
    stop_cheat_caller_address(contract.contract_address);
    
    // Verify thanks system
    assert!(contract.get_thanks_count(store_id) == 2, "Should have 2 thanks");
    assert!(contract.has_user_thanked(store_id, USER1()), "User1 should have thanked");
    assert!(contract.has_user_thanked(store_id, USER2()), "User2 should have thanked");
    
    println!("=== THANKS SYSTEM TEST PASSED ===");
    println!("Total thanks: {}", contract.get_thanks_count(store_id));
    println!("=================================");
}
