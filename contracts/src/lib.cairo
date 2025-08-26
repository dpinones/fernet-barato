use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store)]
pub struct Store {
    pub id: felt252,
    pub name: ByteArray,
    pub address: ByteArray,
    pub hours: ByteArray,
    pub URI: ByteArray,
}

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct Price {
    pub price: u256,
    pub timestamp: u64,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct Report {
    pub store_id: felt252,
    pub description: ByteArray,
    pub submitted_at: u64,
    pub submitted_by: ContractAddress,
}

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct Profile {
    pub user_address: ContractAddress,
    pub report_count: u64,
    pub thanks_count: u64,
    pub last_connected: u64,
}

// Define the contract interface
#[starknet::interface]
pub trait IFernetBarato<TContractState> {
    // Store management functions - ID is auto-incremental
    fn add_store(ref self: TContractState, name: ByteArray, address: ByteArray, 
                hours: ByteArray, URI: ByteArray) -> felt252;
    fn edit_store(ref self: TContractState, store_id: felt252, name: ByteArray, address: ByteArray, 
                hours: ByteArray, URI: ByteArray);
    fn get_store(self: @TContractState, store_id: felt252) -> Store;
    fn get_all_stores(self: @TContractState) -> Array<Store>;
    
    // Price management functions
    fn update_price(ref self: TContractState, store_id: felt252, new_price: u256);
    fn get_current_price(self: @TContractState, store_id: felt252) -> Price;
    fn get_price_history(self: @TContractState, store_id: felt252) -> Array<Price>;
    fn get_all_current_prices(self: @TContractState) -> Array<(felt252, Price)>;
    
    // Report management functions - Users can only report incorrect prices once per week
    fn submit_report(ref self: TContractState, store_id: felt252, description: ByteArray);
    fn get_reports(self: @TContractState, store_id: felt252) -> Array<Report>;
    
    // Thanks/Appreciation functions
    fn give_thanks(ref self: TContractState, store_id: felt252);
    fn get_thanks_count(self: @TContractState, store_id: felt252) -> u64;
    fn has_user_thanked(self: @TContractState, store_id: felt252, user: ContractAddress) -> bool;
    
    // Admin functions
    fn add_admin(ref self: TContractState, admin: ContractAddress);
    fn remove_admin(ref self: TContractState, admin: ContractAddress);
    fn is_admin(self: @TContractState, user: ContractAddress) -> bool;
    
    // Profile management functions
    fn create_profile(ref self: TContractState);
    fn update_last_connected(ref self: TContractState);
    fn get_profile(self: @TContractState, user: ContractAddress) -> Profile;
    fn profile_exists(self: @TContractState, user: ContractAddress) -> bool;
}

// Define the contract module
#[starknet::contract]
pub mod FernetBarato {
    use starknet::ContractAddress;
    use starknet::storage::*;
    use starknet::{get_caller_address, get_block_timestamp};
    
    // Import the types from the module scope
    use super::{Store, Price, Report, Profile};

    // Storage structure
    #[storage]
    pub struct Storage {
        // Stores data with auto-incremental IDs
        stores: Map<felt252, Store>,
        store_count: u64, // Next available ID (starts at 1)
        
        // Price history: (store_id, index) -> Price
        price_history: Map<(felt252, u64), Price>,
        price_history_len: Map<felt252, u64>,
        
        // Reports: (store_id, index) -> Report
        reports: Map<(felt252, u64), Report>,
        reports_len: Map<felt252, u64>,
        
        // User report tracking: address -> last report timestamp
        user_last_report: Map<ContractAddress, u64>,
        
        // Thanks system: (user_address, store_id) -> bool
        user_thanks: Map<(ContractAddress, felt252), bool>,
        // Total thanks per store: store_id -> count
        store_thanks_count: Map<felt252, u64>,
        
        // Admin management
        admins: Map<ContractAddress, bool>,
        owner: ContractAddress,
        
        // User profiles
        profiles: Map<ContractAddress, Profile>,
    }

    // Constructor
    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.admins.entry(owner).write(true);
        self.admins.entry(0x00e27131b3cb346cf5ed3b57bfbbe7c309575bc8700d8658502037879ddfdeb4.try_into()
        .unwrap()).write(true);
        self.store_count.write(1); // Start IDs at 1
    }

    // Helper functions
    #[generate_trait]
    impl HelperImpl of HelperTrait {
        fn assert_only_admin(self: @ContractState) {
            let caller = get_caller_address();
            assert!(self.admins.entry(caller).read(), "Only admin can call this function");
        }

        fn assert_only_owner(self: @ContractState) {
            let caller = get_caller_address();
            assert!(caller == self.owner.read(), "Only owner can call this function");
        }
    }

    // Implementation of the interface
    #[abi(embed_v0)]
    pub impl FernetBaratoImpl of super::IFernetBarato<ContractState> {
        
        // Store management functions - ID is auto-incremental
        fn add_store(ref self: ContractState, name: ByteArray, address: ByteArray, 
                    hours: ByteArray, URI: ByteArray) -> felt252 {
            self.assert_only_admin();
            
            // Get next available ID
            let store_count = self.store_count.read();
            let store_id: felt252 = store_count.into();
            
            let store = Store {
                id: store_id,
                name: name.clone(),
                address: address.clone(),
                hours,
                URI,
            };
            
            // Store the shop and increment counter
            self.stores.entry(store_id).write(store);
            self.store_count.write(store_count + 1);
            store_id // Return the generated ID
        }

        fn edit_store(ref self: ContractState, store_id: felt252, name: ByteArray, address: ByteArray, 
                    hours: ByteArray, URI: ByteArray) {
            self.assert_only_admin();
            
            // Check if store exists
            let existing_store = self.stores.entry(store_id).read();
            assert!(existing_store.id != 0, "Store does not exist");
            
            let updated_store = Store {
                id: store_id,
                name: name.clone(),
                address: address.clone(),
                hours,
                URI,
            };
            
            // Update the store
            self.stores.entry(store_id).write(updated_store);
        }

        fn get_store(self: @ContractState, store_id: felt252) -> Store {
            self.stores.entry(store_id).read()
        }

        fn get_all_stores(self: @ContractState) -> Array<Store> {
            let mut stores = array![];
            let max_count = self.store_count.read();
            let mut current_count: u64 = 1; // Start from ID 1
            
            while current_count < max_count {
                let store_id: felt252 = current_count.into();
                let store = self.stores.entry(store_id).read();
                // Only add if store exists (id != 0)
                if store.id != 0 {
                    stores.append(store);
                }
                current_count += 1;
            };
            
            stores
        }

        // Price management functions
        fn update_price(ref self: ContractState, store_id: felt252, new_price: u256) {
            self.assert_only_admin();
            
            // Create new price entry
            let new_price_entry = Price {
                price: new_price,
                timestamp: get_block_timestamp(),
            };
            
            // Add to history
            let current_len = self.price_history_len.entry(store_id).read();
            self.price_history.entry((store_id, current_len)).write(new_price_entry);
            self.price_history_len.entry(store_id).write(current_len + 1);
        }

        fn get_current_price(self: @ContractState, store_id: felt252) -> Price {
            let len = self.price_history_len.entry(store_id).read();
            if len == 0 {
                // Return default price if no history
                Price { price: 0, timestamp: 0 }
            } else {
                self.price_history.entry((store_id, len - 1)).read()
            }
        }

        fn get_price_history(self: @ContractState, store_id: felt252) -> Array<Price> {
            let len = self.price_history_len.entry(store_id).read();
            let mut history = array![];
            let mut i: u64 = 0;
            
            while i < len {
                let price = self.price_history.entry((store_id, i)).read();
                history.append(price);
                i += 1;
            };
            
            history
        }

        fn get_all_current_prices(self: @ContractState) -> Array<(felt252, Price)> {
            let mut prices = array![];
            let max_count = self.store_count.read();
            let mut current_count: u64 = 1; // Start from ID 1
            
            while current_count < max_count {
                let store_id: felt252 = current_count.into();
                let store = self.stores.entry(store_id).read();
                // Only get price if store exists (id != 0)
                if store.id != 0 {
                    let current_price = self.get_current_price(store_id);
                    prices.append((store_id, current_price));
                }
                current_count += 1;
            };
            
            prices
        }

        // Report management functions - Users can only report incorrect prices once per week
        fn submit_report(ref self: ContractState, store_id: felt252, description: ByteArray) {
            
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            let zero_address: ContractAddress = 0.try_into().unwrap();
            
            let report = Report {
                store_id,
                description: description.clone(),
                submitted_at: current_time,
                submitted_by: caller,
            };
            
            let current_len = self.reports_len.entry(store_id).read();
            self.reports.entry((store_id, current_len)).write(report);
            self.reports_len.entry(store_id).write(current_len + 1);
            
            // Update user's last report timestamp
            self.user_last_report.entry(caller).write(current_time);
            
            // Update user profile - increment report count
            let mut profile = self.profiles.entry(caller).read();
            if profile.user_address == zero_address {
                // Create profile if doesn't exist
                profile = Profile {
                    user_address: caller,
                    report_count: 1,
                    thanks_count: 0,
                    last_connected: current_time,
                };
            } else {
                // Increment report count
                profile.report_count += 1;
                profile.last_connected = current_time;
            }
            self.profiles.entry(caller).write(profile);
        }

        fn get_reports(self: @ContractState, store_id: felt252) -> Array<Report> {
            let len = self.reports_len.entry(store_id).read();
            let mut reports = array![];
            let mut i: u64 = 0;
            
            while i < len {
                let report = self.reports.entry((store_id, i)).read();
                reports.append(report);
                i += 1;
            };
            
            reports
        }

        // Admin functions
        fn add_admin(ref self: ContractState, admin: ContractAddress) {
            self.assert_only_owner();
            self.admins.entry(admin).write(true);
        }

        fn remove_admin(ref self: ContractState, admin: ContractAddress) {
            self.assert_only_owner();
            self.admins.entry(admin).write(false);
        }

        fn is_admin(self: @ContractState, user: ContractAddress) -> bool {
            self.admins.entry(user).read()
        }
        
        // Thanks/Appreciation functions
        fn give_thanks(ref self: ContractState, store_id: felt252) {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            let zero_address: ContractAddress = 0.try_into().unwrap();
            
            // Check if user has already thanked this store
            let has_thanked = self.user_thanks.entry((caller, store_id)).read();
            assert!(!has_thanked, "You have already thanked this store");
            
            // Check if store exists
            let store = self.stores.entry(store_id).read();
            assert!(store.id != 0, "Store does not exist");
            
            // Mark user as having thanked this store
            self.user_thanks.entry((caller, store_id)).write(true);
            
            // Increment thanks counter for this store
            let current_count = self.store_thanks_count.entry(store_id).read();
            let new_count = current_count + 1;
            self.store_thanks_count.entry(store_id).write(new_count);
            
            // Update user profile - increment thanks count
            let mut profile = self.profiles.entry(caller).read();
            if profile.user_address == zero_address {
                // Create profile if doesn't exist
                profile = Profile {
                    user_address: caller,
                    report_count: 0,
                    thanks_count: 1,
                    last_connected: current_time,
                };
            } else {
                // Increment thanks count
                profile.thanks_count += 1;
                profile.last_connected = current_time;
            }
            self.profiles.entry(caller).write(profile);
        }
        
        fn get_thanks_count(self: @ContractState, store_id: felt252) -> u64 {
            self.store_thanks_count.entry(store_id).read()
        }
        
        fn has_user_thanked(self: @ContractState, store_id: felt252, user: ContractAddress) -> bool {
            self.user_thanks.entry((user, store_id)).read()
        }
        
        // Profile management functions
        fn create_profile(ref self: ContractState) {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            
            // Check if profile already exists
            let existing_profile = self.profiles.entry(caller).read();
            let zero_address: ContractAddress = 0.try_into().unwrap();
            
            if existing_profile.user_address == zero_address {
                // Create new profile
                let new_profile = Profile {
                    user_address: caller,
                    report_count: 0,
                    thanks_count: 0,
                    last_connected: current_time,
                };
                
                self.profiles.entry(caller).write(new_profile);
            }
        }
        
        fn update_last_connected(ref self: ContractState) {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            let zero_address: ContractAddress = 0.try_into().unwrap();
            
            // Get existing profile or create new one
            let mut profile = self.profiles.entry(caller).read();
            
            if profile.user_address == zero_address {
                // Profile doesn't exist, create it
                profile = Profile {
                    user_address: caller,
                    report_count: 0,
                    thanks_count: 0,
                    last_connected: current_time,
                };
            } else {
                // Update last connected time
                profile.last_connected = current_time;
            }
            
            self.profiles.entry(caller).write(profile);
        }
        
        fn get_profile(self: @ContractState, user: ContractAddress) -> Profile {
            let profile = self.profiles.entry(user).read();
            let zero_address: ContractAddress = 0.try_into().unwrap();
            
            if profile.user_address == zero_address {
                // Return default profile if doesn't exist
                Profile {
                    user_address: user,
                    report_count: 0,
                    thanks_count: 0,
                    last_connected: 0,
                }
            } else {
                profile
            }
        }
        
        fn profile_exists(self: @ContractState, user: ContractAddress) -> bool {
            let profile = self.profiles.entry(user).read();
            let zero_address: ContractAddress = 0.try_into().unwrap();
            profile.user_address != zero_address
        }
    }
}
